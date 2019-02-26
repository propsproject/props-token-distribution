const htmlToText = require('html-to-text');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const outputData = require('../../output/test_output.json');

for (let i = 0; i < outputData.allocations.length; i += 1) {
  const recipient = outputData.allocations[i];
  const body = prepareBody(recipient);
  const params = prepareEmail(recipient.email,body,'Props Token Distribution Confirmation','support@propsproject.com');
  //sendEmail(params);
  console.log(params.Message.Body.Text.Data);
  //console.log(params);
}

function prepareBody(recipient) {
  let body = '';
  body += 'Hi ' + recipient.firstName + ',';
  body += '<br><br>';
  body += 'Thank you for supporting Props. Your Props Tokens have been successfully distributed to the '
  body += 'wallet address you provided. You’ll find a detailed summary of your Props holdings below: ';
  body += '<br><br>';
  body += '<ul>';
  body += '<li>' + 'Ethereum address: ' + recipient.beneficiary + '</li>';
  if(recipient.investedAmount) {
  body += '<li>' + 'Amount contributed in USD: $' + recipient.investedAmount + '</li>';
  }
  body += '<li>' + 'Initial Token price: $0.1369'  + '</li>';
  if(recipient.investedDiscount) {
  body += '<li>' + 'Your discount: '+ recipient.investedDiscount + '%'  + '</li>';
  body += '<li>' + 'Your discounted Token price:'  + '</li>';
  }
  if(recipient.investedAmount) {
  body += '<li>' + 'Initial Token allocation: ' +  recipient.tokensToGrant + '</li>';
  body += '</ul>';
  body += 'As you remember, we chose to reward our early investors with a 10% bonus in March 2018. ';
  body += 'Given that bonus, your token allocation has increased:';
  body += '<br><br>';
  body += '<ul>';
  body += '<li>' + 'Bonus Tokens: '  + '</li>';
  }
  body += '<li>' + 'Your total Token allocation: {amount} '  + '</li>';
  if(recipient.investedAmount) {
  body += '<li>' + 'Your final Token price: ${price}'  + '</li>';
  }
  body += '</ul>';
  if(recipient.vestingContractAddress) {
  body += '<b>Your Vesting Schedule</b>'  + '<br><br>';
  body += 'Your Props are subject to a vesting schedule governed by a unique Smart Vesting Contract, '
  body += 'which you own. You already have access to 20% of your Props. The Contract will unlock your '
  body += 'remaining tokens on a linear schedule (ie. more tokens will vest on a daily basis).';
  body += '<br><br>';
  body += '<ul>';
  body += '<li>' + 'Vesting contract address: ' + recipient.vestingContractAddress  + '</li>';
  body += '<li>' + 'Vesting length: ' + recipient.vestingLength  + '</li>';
  body += '</ul>';
  body += 'Moving forward, visit the Props Vesting Dashboard to see details on your vesting schedule, '
  body += 'and confirm how many of your tokens have vested. You may transfer vested tokens to your '
  body += 'address at any time. '
  body += '<br><br>'
  }
  body += 'View your tokens <a href="https://google.com">here</a>' + '<br><br>';
  body += 'Bye';
  return body;
}

function prepareEmail(to,body,subject,from) {
  return {
    Destination: { /* required */
      ToAddresses: [
        to,
        /* more items */
      ]
    },
    Message: { /* required */
      Body: { /* required */
        Html: {
         Charset: "UTF-8",
         Data: body
        },
        Text: {
         Charset: "UTF-8",
         Data: htmlToText.fromString(body, {})
        }
       },
       Subject: {
        Charset: 'UTF-8',
        Data: subject
       }
      },
    Source: from, /* required */
  };
}

function sendEmail(params) {
  const sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
  sendPromise.then(
    function(data) {
      console.log(data);
      console.log(data.MessageId);
    }).catch(
      function(err) {
      console.error(err, err.stack);
    });
}

  