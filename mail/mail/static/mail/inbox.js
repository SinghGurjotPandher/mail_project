if (!localStorage.getItem('variable')) {
  localStorage.setItem('variable', 0);
}

document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  // By default, load the inbox otherwise load the sent mailbox
  value = localStorage.getItem('variable')
  if (value == 1) {
    load_mailbox('sent')
  }
  else if (value == 0) {
    load_mailbox('inbox')
  }
});

function compose_email(b = 0) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view_each').style.display = 'none';

  document.querySelector('#compose-form').onsubmit = function(){
    localStorage.setItem('variable', 1)
    // POST OR SEND EMAIL
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    });
  }
  // Clear out composition fields
  if (b > 0){
    b = 1
  }
  else {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
}

function load_mailbox(mailbox) {
  localStorage.setItem('variable', 0)
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view_each').style.display = 'none';
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    document.querySelector('#emails-view').innerHTML += `<table id = 'mytable'></table>`;
    const table = document.getElementById('mytable');
    emails.forEach((email) => {
      var row = table.insertRow(-1);
      var cell1 = row.insertCell(0);
      var cell2 = row.insertCell(1);
      var cell3 = row.insertCell(2);
      cell1.innerHTML = `${email.sender}`;
      cell2.innerHTML = `${email.subject}`;
      cell3.innerHTML = `${email.timestamp}`;
      if (email.read) {
        row.style.backgroundColor = 'lightgray';
      }
      else {
        row.style.backgroundColor = 'white';
      }
      row.addEventListener('click', function(){
        each_mail(email.id,mailbox)
      });
    });
  })
}

function each_mail(id,mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view_each').style.display = 'block';
  
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#view_each').innerHTML = `<b> From: </b> ${email.sender} <br> <b> To: </b> ${email.recipients} <br> <b> Subject: </b> ${email.subject} <br> <b> Timestamp: </b> ${email.timestamp} <br>`;
    if (mailbox === 'inbox' || mailbox === 'archive'){
      if (email.archived) {
        document.querySelector('#view_each').innerHTML += `<button onclick = 'unarchive_email(${id})'>Unarchive</button>`;
      } 
      else {
        document.querySelector('#view_each').innerHTML += `<button onclick = 'archive_email(${id})'>Archive</button>`;
      }
      document.querySelector('#view_each').innerHTML += `<button onclick = 'reply_email(${id})'>Reply</button>`;
    }
    document.querySelector('#view_each').innerHTML += `<hr> ${email.body}`;
  })
  fetch(`/emails/${id}`,{
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}

function reply_email(id){
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#compose-recipients').value = `${email.sender}`;
    let email_subject = email.subject
    let re_subject = email_subject.slice(0,3);
    if (re_subject === 'Re:') {
      document.querySelector('#compose-subject').value = ` ${email.subject}`;
    }
    else {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;  
  })
  compose_email(1)
}

function unarchive_email(id){
  fetch(`/emails/${id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  load_mailbox('inbox')
  location.reload()
}

function archive_email(id){
  fetch(`/emails/${id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  load_mailbox('inbox')
  location.reload()
}