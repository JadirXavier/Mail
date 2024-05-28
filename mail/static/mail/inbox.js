document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#content-view').style.display = 'none';
  
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);


    emails.forEach(email => {
      const email_element = document.createElement('div');
      email_element.innerHTML = `
        <div class="card container" id="email-${email.id}">
          <div class="row">
            <div class="card-body col-sm-2">
              ${email.sender}
            </div>
            <div class="card-body col-sm-8">
              ${email.subject}
            </div>
            <div class="card-body col-sm-2">
              ${email.timestamp}
            </div>
          </div>
        </div>
      `;

      document.querySelector('#emails-view').append(email_element);

      // Adds eventListener for each email
      email_element.addEventListener('click', () => view_email(email.id));

      if (email.read) {
        document.getElementById(`email-${email.id}`).style.backgroundColor = '#94b5c4';
      }

    });
  });

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';
  

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}

function send_email(event) {
  event.preventDefault();

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
      if(!result.error) {
        load_mailbox('sent')
        console.log(result);
      }
  });
}

function view_email(id) {
  document.querySelector("#content-view").innerHTML=''
  document.querySelector('#content-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    const content_element = document.createElement('div');
    content_element.innerHTML = `
      <div class="card border-0">
      <div class="card-header px-0 py-3">
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients}</p>
        <p><strong>Subject:</strong> ${email.subject}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <div class="d-flex flex-row" >
          <button class="btn btn-sm btn-outline-primary me-1" id="reply">Reply</button>
          <button class="btn btn-sm btn-outline-primary ms-1" id="archive"></button>
        </div>
      </div>
      <div class="card-body">
        <p class="card-text">${email.body}</p>
      </div>
    </div>
    `;

    if(!email.read) {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }

    document.querySelector('#content-view').append(content_element);

    if(!email.archived) {
      document.querySelector('#archive').innerHTML = "Archive"
    } else {
      document.querySelector('#archive').innerHTML = "Unarchive"
    }

    document.querySelector('#archive').addEventListener('click', () => {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived
        })
      })
      .then(() => {load_mailbox('inbox')})
    })

    document.querySelector('#reply').addEventListener('click', () => {
      compose_email()

      document.querySelector('#compose-recipients').value = email.sender;
      if (email.subject.startsWith("Re:")) {
        document.querySelector('#compose-subject').value = `${email.subject}`;
      } else {
        document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
      }
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: \n ${email.body}`;
    })
  });
  
}