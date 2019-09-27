import React, { Component } from 'react';
import './Configure.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';

class Configure extends Component {
    constructor(props) {
        super(props);
        this.state = {
            emailColumn: null,
            columns: []
        }

        this.handleSelectedFieldChange = this.handleSelectedFieldChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async componentDidMount() {
        let columns = new Set();
        const ext = window.tableau.extensions;
        await ext.initializeDialogAsync();
        const worksheets = ext.dashboardContent.dashboard.worksheets;
        const columnPromises = worksheets.map(async ws => {
            const dataTable = await ws.getSummaryDataAsync();
            dataTable.columns.map(col => columns.add(col.fieldName));
        });
        await Promise.all(columnPromises);
        this.setState({
            columns: [...columns],
            emailColumn: [...columns][0]
        });
        console.log(columns);
    }

    handleSelectedFieldChange(event) {
        this.setState({emailColumn: event.target.value})
    }

    handleSubmit() {
        console.log(this.state.emailColumn);
        window.tableau.extensions.settings.set('emailField', this.state.emailColumn);
        //TODO:Why isn't this closing?!
        window.tableau.extensions.settings.saveAsync().then( () => {
            console.log('saved email field');
            window.tableau.extensions.ui.closeDialog('');
        })
        .catch( (err) => {
            console.error('there was an error saving');
        });
        window.tableau.extensions.ui.closeDialog('');
    }

    render() {
        return (
            <Form onSubmit={this.handleSubmit}>
              <Form.Group>
                <Form.Label htmlFor="subject">Choose the email address field</Form.Label>
                <Form.Control as="select" id="emailField" name="emailField" onChange={this.handleSelectedFieldChange}>
                    {
                        this.state.columns.map( col => {
                            return (<option>{col}</option>);
                        })
                    }
                </Form.Control>
              </Form.Group>
              <Button className="d-inline-block" variant="primary" type="submit">
                Done
              </Button>
            </Form>
        );
    }
}

export default Configure;