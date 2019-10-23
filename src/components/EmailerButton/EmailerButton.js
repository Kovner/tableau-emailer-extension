import React, { Component } from 'react';
import './EmailerButton.css';
import EmailIcon from '../../images/email_icon.png'

class EmailerButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
        windowHeight: window.innerHeight
    };

    this.configure = this.configure.bind(this);
    this.showEmailForm = this.showEmailForm.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', () =>
      this.setState({ windowHeight: window.innerHeight })
    );
    const ext = window.tableau.extensions
    ext.initializeAsync({ configure: this.configure })
      .then(() => {
          console.log("Extension initialized");
      });
  }


  configure() {
    const popupUrl = `${window.location.origin}${
      window.location.pathname
    }#/config`;
    window.tableau.extensions.ui
      .displayDialogAsync(popupUrl, '', {
        height: 481,
        width: 375
      })
      .then(closePayload => {
        console.log("configure dialog closed");
      })
      .catch(error => {
        switch (error.errorCode) {
          case window.tableau.ErrorCodes.DialogClosedByUser:
            console.log('Config Dialog was closed by user.');
            break;
          default:
            console.error(error.message);
        }
      });
  }

  async showEmailForm() {
    const dims = {
        width: 600,
        height: 600
    };
    const popupUrl = `${window.location.origin}${
      window.location.pathname
    }#/emailform`;
    window.tableau.extensions.ui
      .displayDialogAsync(popupUrl, '', dims)
      .then(closePayload => {
        console.log("email form closed");
      })
      .catch(error => {
        switch (error.errorCode) {
          case window.tableau.ErrorCodes.DialogClosedByUser:
            console.log('Email Form was closed by user.');
            break;
          default:
            console.error(error.message);
        }
      });
  }

  render() {
    let img = new Image();
    img.src = EmailIcon;
    const imgStyle = {
      width: '100%',
      height: this.state.windowHeight - 20,
      backgroundImage: `url(${img.src})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      cursor: 'pointer'
    };
    return <div style={imgStyle} onClick={() => this.showEmailForm()} />;
  }
}

export default EmailerButton;
