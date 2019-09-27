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
      disabled: true,
      buttonMessage: "Send Email",
      selectedEmails: [],
      selectedMarksDT: []
    };

    this.getSelectedMarks = this.getSelectedMarks.bind(this);
    this.getEmailsFromMarks = this.getEmailsFromMarks.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
  }

  handleMessageChange(event) {
    let disabled = true;
    if(event.target.value != '' && this.state.subject != '') {
      disabled = false;
    }
    this.setState({
      message: event.target.value,
      disabled: disabled,
      buttonMessage: "Send Email"
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
      buttonMessage: "Send Email"
    });
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

  async componentDidMount() {
    await window.tableau.extensions.initializeDialogAsync();
    const marksDTs = await this.getSelectedMarks();
    //Only one DT actually will have selected marks in it, so let's filter...
    const marksDT = marksDTs.find(marksDT => marksDT.columns.length > 0);
    const selectedEmails = this.getEmailsFromMarks(marksDT);
    console.log(marksDT);
    this.setState({ 
      selectedEmails: selectedEmails,
      selectedMarksDT: marksDT
    });
  }
  
  // async handleSubmit(event) {
  //   event.preventDefault();
  //   console.log('submitting: ');
  //   console.log(this.state);

  //   try {
  //       await axios.post('http://localhost:3030/api/email', {
  //           to_addresses: this.state.selectedEmails,
  //           from_address: 'mike.kovner@gmail.com',
  //           subject: this.state.subject,
  //           message: this.state.message
  //       });
  //       this.setState({
  //         subject: '', 
  //         message: '', 
  //         disabled: true,
  //         buttonMessage: "Email Sent"
  //       });
  //       // window.tableau.extensions.ui.closeDialog();
  //   } catch (err) {
  //       console.error(err.response);
  //       // window.tableau.extensions.ui.closeDialog();
  //   }
  // }

  async handleSubmit(event) {
    // event.preventDefault();
    // console.log('submitting: ');
    // console.log(this.state);

    // this.state.selectedMarksDTs

    // try {
    //     await axios.post('http://localhost:3030/api/email', {
    //         to_addresses: this.state.selectedEmails,
    //         from_address: 'mike.kovner@gmail.com',
    //         subject: this.state.subject,
    //         message: this.state.message
    //     });
    //     this.setState({
    //       subject: '', 
    //       message: '', 
    //       disabled: true,
    //       buttonMessage: "Email Sent"
    //     });
    //     // window.tableau.extensions.ui.closeDialog();
    // } catch (err) {
    //     console.error(err.response);
    //     // window.tableau.extensions.ui.closeDialog();
    // }
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
            <Form.Control id="subject" name="subject" type="text" value={this.state.subject} onChange={this.handleSubjectChange}/>
          </Form.Group>
          <Form.Group>
            <Form.Label htmlFor="message">Message</Form.Label>
            <Form.Control id="message" name="message" as="textarea" rows="20" value={this.state.message} onChange={this.handleMessageChange}/>
          </Form.Group>
          <Button className="d-inline-block" variant="primary" type="submit" disabled={this.state.disabled}>
            {this.state.buttonMessage}
          </Button>
        </Form>
      </div>
    );
  }
}

export default EmailForm;
