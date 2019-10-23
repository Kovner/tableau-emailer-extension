import React, { Component } from 'react';
import './EmailForm.css';
import axios from 'axios';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';

import Mustache from 'mustache';
import 'bootstrap/dist/css/bootstrap.min.css';

class EmailForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      subject: '',
      disabled: true,
      buttonMessage: "Send Email",
      selectedEmails: [],
      fields: [],
      cursor: {input: 'message', loc: 0}
    };
    this.subjectRef = React.createRef();
    this.messageRef = React.createRef();

    this.getSelectedMarks = this.getSelectedMarks.bind(this);
    this.getEmailsFromMarks = this.getEmailsFromMarks.bind(this);
    this.fillPlaceholders = this.fillPlaceholders.bind(this);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.handleSubjectSelect = this.handleSubjectSelect.bind(this);
    this.handleMessageSelect = this.handleMessageSelect.bind(this);
    this.handleInsert = this.handleInsert.bind(this);
  }

  handleMessageChange(event) {
    let disabled = true;
    if(event.target.value != '' && this.state.subject != '') {
      disabled = false;
    }
    console.log('handle message change refs: ', this.refs);
    this.setState({
      message: event.target.value,
      disabled: disabled,
      buttonMessage: "Send Email",
      cursor: {input: 'message', loc: event.target.selectionStart}
    });
  }
  handleSubjectChange(event) {
    let disabled = true;
    if(event.target.value != '' && this.state.message != '') {
      disabled = false;
    }
    this.setState({
      subject: event.target.value,
      disabled: disabled,
      buttonMessage: "Send Email",
      cursor: {input: 'subject', loc: event.target.selectionStart}
    });
  }

  handleMessageSelect(event) {
    this.setState({cursor: {input: 'message', loc: event.target.selectionStart}})
  }

  handleSubjectSelect(event) {
    this.setState({cursor: {input: 'subject', loc: event.target.selectionStart}})
  }

  handleInsert(event) {
    console.log('insert event: ', event);
    if(this.state.cursor.input === 'message') {
      this.setState({message: 
        this.state.message.substring(0, this.state.cursor.loc)
        + '{{' + event + '}}'
        + this.state.message.substring(this.state.cursor.loc, this.state.message.length)
      }, () => {
        //Set the cursor back where it was (but move it forward for the inserted chars)
        this.messageRef.current.focus();
        this.messageRef.current.selectionStart = this.state.cursor.loc + event.length + 4;
        this.messageRef.current.selectionEnd = this.state.cursor.loc + event.length + 4;
    });
    } else {
      this.setState({subject: 
        this.state.subject.substring(0, this.state.cursor.loc)
        + '{{' + event + '}}'
        + this.state.subject.substring(this.state.cursor.loc, this.state.subject.length)
      }, () => {
          //Set the cursor back where it was (but move it forward for the inserted chars)
          this.subjectRef.current.focus();
          this.subjectRef.current.selectionStart = this.state.cursor.loc + event.length + 4;
          this.subjectRef.current.selectionEnd = this.state.cursor.loc + event.length + 4;
      });
    }
  }

  async getSelectedMarks() {
    let selectedMarksDTs = [];
    const ext = window.tableau.extensions;
    const worksheets = ext.dashboardContent.dashboard.worksheets;
    const marksPromises = worksheets.map(async ws => {
        const marks = await ws.getSelectedMarksAsync();
        selectedMarksDTs.push(marks.data[0]);
    });
    await Promise.all(marksPromises);
    console.log(selectedMarksDTs);
    return selectedMarksDTs;
  }

  getEmailsFromMarks(marksDT) {
    let selectedEmails = [];
    const emailField = window.tableau.extensions.settings.get('emailField');
    if(!emailField) { return []; }
    const field = marksDT.columns.find( col => col.fieldName === emailField);
    if(field) {
      marksDT.data.map( row => {
        selectedEmails.push(row[field.index].value);
      });
    }
    //get uniques
    selectedEmails = [...new Set(selectedEmails)];
    console.log('selected emails: ', selectedEmails);
    return selectedEmails;
  }

  fillPlaceholders(template, mark, columns) {
    const tokens = Mustache.parse(template);
    let placeholderTokens = tokens.filter( token => token[0] === 'name' );
    //get just the value of the tokens
    let placeholders =  placeholderTokens.map( token => token[1]);
    //get just the unique values
    placeholders = [...new Set(placeholders)];
    console.log('placeholders: ' + placeholders);
    
    //Find the relevant data from the mark and create a replacementMap
    let replacementMap = {}
    columns.map(col => console.log(col.fieldName));
    for(const placeholder of placeholders) {
      const field = columns.find( col => col.fieldName === placeholder);
      if(field) {
        replacementMap[placeholder] = mark[field.index].value;
      } else {
        //We don't have that field, so just keep the original value
        replacementMap[placeholder] = placeholder;
      }
    }
    const message = Mustache.render(template, replacementMap);

    return message;
  }

  async componentDidMount() {
    await window.tableau.extensions.initializeDialogAsync();
    const marksDTs = await this.getSelectedMarks();
    //Only one DT actually will have selected marks in it, so let's filter...
    const marksDT = marksDTs.find(marksDT => marksDT.columns.length > 0);
    const selectedEmails = this.getEmailsFromMarks(marksDT);
    const fields = marksDT.columns.map(col => col.fieldName);
    console.log(marksDT);
    this.setState({ 
      selectedEmails: selectedEmails,
      selectedMarksDT: marksDT,
      fields: fields
    });
  }
  
  async handleSubmit(event) {
    event.preventDefault();
    console.log('submitting: ');
    console.log(this.state);

    let emailPromises = [];

    const emailField = window.tableau.extensions.settings.get('emailField');
    if(!emailField) { return []; }
    const columns = this.state.selectedMarksDT.columns
    const field = columns.find( col => col.fieldName === emailField);
    if(field) {
      this.state.selectedMarksDT.data.map( mark => {
        const generatedSubject = this.fillPlaceholders(this.state.subject, mark, columns);
        const generatedMessage = this.fillPlaceholders(this.state.message, mark, columns);

        emailPromises.push(axios.post('http://localhost:3030/api/email', {  
          to_address: mark[field.index].value,
          from_address: 'mike.kovner@gmail.com',
          subject: generatedSubject,
          message: generatedMessage
        }));
      });
      Promise.all(emailPromises).then( () => {
        this.setState({
          subject: '', 
          message: '', 
          disabled: true,
          buttonMessage: "Email Sent"
        });
      })
      .catch(err => console.error(err.response));
    }
  }

  render() {
    // Concatenate all of the selected Emails together, but then remove the first
    let toLine = this.state.selectedEmails.reduce( 
      (acc, cur) => acc + ', ' + cur,
      ' '
    );
    toLine = toLine.slice(2);
    return (
      <div>
        <p>
          To: { toLine }
        </p>
        <Form onSubmit={this.handleSubmit}>
          <Form.Group>
            <Form.Label htmlFor="subject">Subject</Form.Label>
            <Form.Control id="subject" name="subject" type="text" 
              value={this.state.subject} 
              onChange={this.handleSubjectChange}
              onSelct={this.handleSubjectSelect}
              ref={this.subjectRef}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label htmlFor="message">Message</Form.Label>
            <Form.Control id="message" name="message" as="textarea" rows="20" 
              value={this.state.message} 
              onChange={this.handleMessageChange}
              onSelect={this.handleMessageSelect}
              ref={this.messageRef}
            />
          </Form.Group>
          <ButtonToolbar>
            <ButtonGroup>
              <Button className="d-inline-block" variant="primary" type="submit" disabled={this.state.disabled}>
                {this.state.buttonMessage}
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <DropdownButton
                variant="outline-secondary"
                title="Insert Field"
                id="insert-dropdown"
                onSelect={this.handleInsert}
              >
                {this.state.fields.map(field => 
                  <Dropdown.Item eventKey={field}>{field}</Dropdown.Item>
                )}
              </DropdownButton>
            </ButtonGroup>
          </ButtonToolbar>
        </Form>
      </div>
    );
  }
}

export default EmailForm;
