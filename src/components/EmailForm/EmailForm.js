import React, { Component } from 'react';
import './EmailForm.css';
import axios from 'axios';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';

class EmailForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      subject: '',
      disabled: false,
      selectedEmails: [],
      selectedMarksDTs: []
    };

    this.getSelectedMarks = this.getSelectedMarks.bind(this);
    this.getEmailsFromMarks = this.getEmailsFromMarks.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
  }

  handleMessageChange(event) {
    this.setState({message: event.target.value});
  }
  handleSubjectChange(event) {
    this.setState({subject: event.target.value});
  }

  async getSelectedMarks() {
    let selectedMarksDTs = [];
    // const emailField = window.tableau.extensions.settings.get('emailField');
    // if(!emailField) { return []; }
    const ext = window.tableau.extensions;
    const worksheets = ext.dashboardContent.dashboard.worksheets;
    const marksPromises = worksheets.map(async ws => {
        const marks = await ws.getSelectedMarksAsync();
        selectedMarksDTs.push(marks.data[0]);
        // const dataTable = marks.data[0];
        // const field = dataTable.columns.find( col => col.fieldName === emailField);
        // dataTable.data.map( row => {
        //   selectedEmails.push(row[field.index].value);
        // });
    });
    await Promise.all(marksPromises);
    console.log(selectedMarksDTs);
    return selectedMarksDTs;
  }

  getEmailsFromMarks(marksDTs) {
    let selectedEmails = [];
    const emailField = window.tableau.extensions.settings.get('emailField');
    if(!emailField) { return []; }
    for(const DT of marksDTs) {
      const field = DT.columns.find( col => col.fieldName === emailField);
      if(field) {
        DT.data.map( row => {
          selectedEmails.push(row[field.index].value);
        });
      }
    }
    //get uniques
    selectedEmails = [...new Set(selectedEmails)];
    console.log('selected emails: ', selectedEmails);
    return selectedEmails;
  }

  async componentDidMount() {
    await window.tableau.extensions.initializeDialogAsync();
    const marksDTs = await this.getSelectedMarks();
    const selectedEmails = this.getEmailsFromMarks(marksDTs);
    this.setState({ 
      selectedEmails: selectedEmails,
      selectedMarksDTs: marksDTs 
    });
  }
  
  async handleSubmit() {
    console.log('submitting: ');
    console.log(this.state);
    // const subjectPlaceholders = this.findPlaceholders(this.state.subject);
    // const messagePlaceholders = this.findPlaceholders(this.state.message);

    try {
        await axios.post('http://localhost:3030/api/email', {
            to_addresses: this.state.selectedEmails,
            from_address: 'mike.kovner@gmail.com',
            subject: this.state.subject,
            message: this.state.message
        });
        // window.tableau.extensions.ui.closeDialog();
    } catch (err) {
        console.error(err.response);
        // window.tableau.extensions.ui.closeDialog();
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
        <Form onSubmit={this.handleSubmit}>
          <p>
            To: { toLine }
          </p>
          <Form.Group>
            <Form.Label htmlFor="subject">Subject</Form.Label>
            <Form.Control id="subject" name="subject" type="text" value={this.state.subject} onChange={this.handleSubjectChange}/>
          </Form.Group>
          <Form.Group>
            <Form.Label htmlFor="message">Message</Form.Label>
            <Form.Control id="message" name="message" as="textarea" rows="20" value={this.state.message} onChange={this.handleMessageChange}/>
          </Form.Group>
          <Button className="d-inline-block" variant="primary" type="submit">
            Send Email
          </Button>
        </Form>
    );
  }
}

export default EmailForm;