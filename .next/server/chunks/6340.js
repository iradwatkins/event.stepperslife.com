try{!function(){var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="bb2b1804-e6a6-4cf5-bd77-fe1029436d28",e._sentryDebugIdIdentifier="sentry-dbid-bb2b1804-e6a6-4cf5-bd77-fe1029436d28")}()}catch(e){}"use strict";exports.id=6340,exports.ids=[6340],exports.modules={6340:(e,t,r)=>{r.d(t,{g:()=>S});var n=Object.defineProperty,i=Object.defineProperties,s=Object.getOwnPropertyDescriptors,o=Object.getOwnPropertySymbols,a=Object.prototype.hasOwnProperty,d=Object.prototype.propertyIsEnumerable,l=(e,t,r)=>t in e?n(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,c=(e,t)=>{for(var r in t||(t={}))a.call(t,r)&&l(e,r,t[r]);if(o)for(var r of o(t))d.call(t,r)&&l(e,r,t[r]);return e},u=(e,t)=>i(e,s(t)),p=(e,t)=>{var r={};for(var n in e)a.call(e,n)&&0>t.indexOf(n)&&(r[n]=e[n]);if(null!=e&&o)for(var n of o(e))0>t.indexOf(n)&&d.call(e,n)&&(r[n]=e[n]);return r},h=(e,t,r)=>new Promise((n,i)=>{var s=e=>{try{a(r.next(e))}catch(e){i(e)}},o=e=>{try{a(r.throw(e))}catch(e){i(e)}},a=e=>e.done?n(e.value):Promise.resolve(e.value).then(s,o);a((r=r.apply(e,t)).next())});function m(e){let t=new URLSearchParams;return void 0!==e.limit&&t.set("limit",e.limit.toString()),"after"in e&&void 0!==e.after&&t.set("after",e.after),"before"in e&&void 0!==e.before&&t.set("before",e.before),t.toString()}var f=class{constructor(e){this.resend=e}create(e){return h(this,arguments,function*(e,t={}){return yield this.resend.post("/api-keys",e,t)})}list(){return h(this,arguments,function*(e={}){let t=m(e),r=t?`/api-keys?${t}`:"/api-keys";return yield this.resend.get(r)})}remove(e){return h(this,null,function*(){return yield this.resend.delete(`/api-keys/${e}`)})}},g=class{constructor(e){this.resend=e}create(e){return h(this,arguments,function*(e,t={}){return yield this.resend.post("/audiences",e,t)})}list(){return h(this,arguments,function*(e={}){let t=m(e),r=t?`/audiences?${t}`:"/audiences";return yield this.resend.get(r)})}get(e){return h(this,null,function*(){return yield this.resend.get(`/audiences/${e}`)})}remove(e){return h(this,null,function*(){return yield this.resend.delete(`/audiences/${e}`)})}};function y(e){var t;return{attachments:null==(t=e.attachments)?void 0:t.map(e=>({content:e.content,filename:e.filename,path:e.path,content_type:e.contentType,content_id:e.contentId})),bcc:e.bcc,cc:e.cc,from:e.from,headers:e.headers,html:e.html,reply_to:e.replyTo,scheduled_at:e.scheduledAt,subject:e.subject,tags:e.tags,text:e.text,to:e.to}}function b(e){return new Promise((t,n)=>{r.e(1762).then(r.t.bind(r,81762,19)).then(({render:r})=>{t(r(e))}).catch(()=>{n(Error("Failed to render React component. Make sure to install `@react-email/render`"))})})}var v=class{constructor(e){this.resend=e}send(e,t){return h(this,null,function*(){return this.create(e,t)})}create(e,t){return h(this,null,function*(){var r;let n=[];for(let t of e)t.react&&(t.html=yield b(t.react),t.react=void 0),n.push(y(t));return yield this.resend.post("/emails/batch",n,u(c({},t),{headers:c({"x-batch-validation":null!=(r=null==t?void 0:t.batchValidation)?r:"strict"},null==t?void 0:t.headers)}))})}},x=class{constructor(e){this.resend=e}create(e){return h(this,arguments,function*(e,t={}){return e.react&&(e.html=yield b(e.react)),yield this.resend.post("/broadcasts",{name:e.name,audience_id:e.audienceId,preview_text:e.previewText,from:e.from,html:e.html,reply_to:e.replyTo,subject:e.subject,text:e.text},t)})}send(e,t){return h(this,null,function*(){return yield this.resend.post(`/broadcasts/${e}/send`,{scheduled_at:null==t?void 0:t.scheduledAt})})}list(){return h(this,arguments,function*(e={}){let t=m(e),r=t?`/broadcasts?${t}`:"/broadcasts";return yield this.resend.get(r)})}get(e){return h(this,null,function*(){return yield this.resend.get(`/broadcasts/${e}`)})}remove(e){return h(this,null,function*(){return yield this.resend.delete(`/broadcasts/${e}`)})}update(e,t){return h(this,null,function*(){return t.react&&(t.html=yield b(t.react)),yield this.resend.patch(`/broadcasts/${e}`,{name:t.name,audience_id:t.audienceId,from:t.from,html:t.html,text:t.text,subject:t.subject,reply_to:t.replyTo,preview_text:t.previewText})})}},w=class{constructor(e){this.resend=e}create(e){return h(this,arguments,function*(e,t={}){return yield this.resend.post(`/audiences/${e.audienceId}/contacts`,{unsubscribed:e.unsubscribed,email:e.email,first_name:e.firstName,last_name:e.lastName},t)})}list(e){return h(this,null,function*(){let{audienceId:t}=e,r=m(p(e,["audienceId"])),n=r?`/audiences/${t}/contacts?${r}`:`/audiences/${t}/contacts`;return yield this.resend.get(n)})}get(e){return h(this,null,function*(){return e.id||e.email?yield this.resend.get(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}update(e){return h(this,null,function*(){return e.id||e.email?yield this.resend.patch(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`,{unsubscribed:e.unsubscribed,first_name:e.firstName,last_name:e.lastName}):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}remove(e){return h(this,null,function*(){return e.id||e.email?yield this.resend.delete(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}},E=class{constructor(e){this.resend=e}create(e){return h(this,arguments,function*(e,t={}){return yield this.resend.post("/domains",{name:e.name,region:e.region,custom_return_path:e.customReturnPath},t)})}list(){return h(this,arguments,function*(e={}){let t=m(e),r=t?`/domains?${t}`:"/domains";return yield this.resend.get(r)})}get(e){return h(this,null,function*(){return yield this.resend.get(`/domains/${e}`)})}update(e){return h(this,null,function*(){return yield this.resend.patch(`/domains/${e.id}`,{click_tracking:e.clickTracking,open_tracking:e.openTracking,tls:e.tls})})}remove(e){return h(this,null,function*(){return yield this.resend.delete(`/domains/${e}`)})}verify(e){return h(this,null,function*(){return yield this.resend.post(`/domains/${e}/verify`)})}},$=class{constructor(e){this.resend=e}send(e){return h(this,arguments,function*(e,t={}){return this.create(e,t)})}create(e){return h(this,arguments,function*(e,t={}){return e.react&&(e.html=yield b(e.react)),yield this.resend.post("/emails",y(e),t)})}get(e){return h(this,null,function*(){return yield this.resend.get(`/emails/${e}`)})}list(){return h(this,arguments,function*(e={}){let t=m(e),r=t?`/emails?${t}`:"/emails";return yield this.resend.get(r)})}update(e){return h(this,null,function*(){return yield this.resend.patch(`/emails/${e.id}`,{scheduled_at:e.scheduledAt})})}cancel(e){return h(this,null,function*(){return yield this.resend.post(`/emails/${e}/cancel`)})}},k="undefined"!=typeof process&&process.env&&process.env.RESEND_BASE_URL||"https://api.resend.com",T="undefined"!=typeof process&&process.env&&process.env.RESEND_USER_AGENT||"resend-node:6.1.1";let _=new class{constructor(e){if(this.key=e,this.apiKeys=new f(this),this.audiences=new g(this),this.batch=new v(this),this.broadcasts=new x(this),this.contacts=new w(this),this.domains=new E(this),this.emails=new $(this),!e&&("undefined"!=typeof process&&process.env&&(this.key=process.env.RESEND_API_KEY),!this.key))throw Error('Missing API key. Pass it to the constructor `new Resend("re_123")`');this.headers=new Headers({Authorization:`Bearer ${this.key}`,"User-Agent":T,"Content-Type":"application/json"})}fetchRequest(e){return h(this,arguments,function*(e,t={}){try{let r=yield fetch(`${k}${e}`,t);if(!r.ok)try{let e=yield r.text();return{data:null,error:JSON.parse(e)}}catch(t){if(t instanceof SyntaxError)return{data:null,error:{name:"application_error",message:"Internal server error. We are unable to process your request right now, please try again later."}};let e={message:r.statusText,name:"application_error"};if(t instanceof Error)return{data:null,error:u(c({},e),{message:t.message})};return{data:null,error:e}}return{data:yield r.json(),error:null}}catch(e){return{data:null,error:{name:"application_error",message:"Unable to fetch data. The request could not be resolved."}}}})}post(e,t){return h(this,arguments,function*(e,t,r={}){let n=new Headers(this.headers);if(r.headers)for(let[e,t]of new Headers(r.headers).entries())n.set(e,t);r.idempotencyKey&&n.set("Idempotency-Key",r.idempotencyKey);let i=u(c({method:"POST",body:JSON.stringify(t)},r),{headers:n});return this.fetchRequest(e,i)})}get(e){return h(this,arguments,function*(e,t={}){let r=new Headers(this.headers);if(t.headers)for(let[e,n]of new Headers(t.headers).entries())r.set(e,n);let n=u(c({method:"GET"},t),{headers:r});return this.fetchRequest(e,n)})}put(e,t){return h(this,arguments,function*(e,t,r={}){let n=new Headers(this.headers);if(r.headers)for(let[e,t]of new Headers(r.headers).entries())n.set(e,t);let i=u(c({method:"PUT",body:JSON.stringify(t)},r),{headers:n});return this.fetchRequest(e,i)})}patch(e,t){return h(this,arguments,function*(e,t,r={}){let n=new Headers(this.headers);if(r.headers)for(let[e,t]of new Headers(r.headers).entries())n.set(e,t);let i=u(c({method:"PATCH",body:JSON.stringify(t)},r),{headers:n});return this.fetchRequest(e,i)})}delete(e,t){return h(this,null,function*(){let r={method:"DELETE",body:JSON.stringify(t),headers:this.headers};return this.fetchRequest(e,r)})}}(process.env.RESEND_API_KEY);class N{async sendEmail(e){if(!process.env.RESEND_API_KEY)return console.warn("Resend API key not configured. Email not sent."),!1;try{let{data:t,error:r}=await _.emails.send({from:`${this.fromName} <${this.fromEmail}>`,to:[e.to],subject:e.subject,html:e.html,text:e.text||this.stripHtml(e.html)});if(r)return console.error("Resend error:",r),!1;return console.log(`Email sent successfully to ${e.to}`,t),!0}catch(e){return console.error("Failed to send email:",e),!1}}async sendTicketPurchaseConfirmation(e){let t={to:e.buyerEmail,subject:`Your tickets for ${e.eventName} - Order ${e.orderNumber}`,html:this.generateTicketConfirmationHTML(e)};return this.sendEmail(t)}async sendEventCreatedConfirmation(e){let t={to:e.organizerEmail,subject:`Event Created: ${e.eventName}`,html:this.generateEventCreatedHTML(e)};return this.sendEmail(t)}async sendEventReminderToAttendees(e,t,r,n){return Promise.all(n.map(n=>{let i={to:n.email,subject:`Reminder: ${e} is tomorrow!`,html:this.generateEventReminderHTML(n.name,e,t,r)};return this.sendEmail(i)}))}async sendVerificationEmail(e,t,r){let n={to:e,subject:"Verify your SteppersLife Events account",html:this.generateVerificationHTML(t,r)};return this.sendEmail(n)}generateTicketConfirmationHTML(e){return`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Confirmation - ${e.eventName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .ticket { background: white; border: 2px dashed #e5e7eb; padding: 20px; margin: 15px 0; border-radius: 8px; }
    .total { background: #1f2937; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
    .qr-code { text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎫 Ticket Confirmation</h1>
    <p>Thank you for your purchase!</p>
  </div>

  <div class="content">
    <h2>Hello ${e.buyerName}!</h2>

    <p>Your tickets for <strong>${e.eventName}</strong> have been confirmed!</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>📅 Event Details</h3>
      <p><strong>Event:</strong> ${e.eventName}</p>
      <p><strong>Date:</strong> ${e.eventDate}</p>
      <p><strong>Venue:</strong> ${e.eventVenue}</p>
      <p><strong>Order Number:</strong> ${e.orderNumber}</p>
    </div>

    <h3>🎟️ Your Tickets</h3>
    ${e.tickets.map(e=>`
      <div class="ticket">
        <p><strong>Ticket:</strong> ${e.ticketNumber}</p>
        <p><strong>Type:</strong> ${e.type}</p>
        <p><strong>Price:</strong> $${e.price.toFixed(2)}</p>
      </div>
    `).join("")}

    <div class="total">
      Total: $${e.totalAmount.toFixed(2)} (${e.ticketCount} ticket${e.ticketCount>1?"s":""})
    </div>

    ${e.qrCodeUrl?`
      <div class="qr-code">
        <h3>📱 Mobile Tickets</h3>
        <p>Show this QR code at the event entrance:</p>
        <img src="${e.qrCodeUrl}" alt="QR Code" style="max-width: 200px;">
      </div>
    `:""}

    <div style="margin-top: 30px; text-align: center;">
      <p>Need to make changes to your order?</p>
      <a href="#" class="button">View My Tickets</a>
    </div>
  </div>

  <div class="footer">
    <p>Questions? Contact us at support@events.stepperslife.com</p>
    <p>\xa9 2024 SteppersLife Events. All rights reserved.</p>
  </div>
</body>
</html>`}generateEventCreatedHTML(e){return`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Created - ${e.eventName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
    .action-button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Event Created Successfully!</h1>
  </div>

  <div class="content">
    <h2>Hello ${e.organizerName}!</h2>

    <p>Congratulations! Your event <strong>${e.eventName}</strong> has been created successfully.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>📅 Event Details</h3>
      <p><strong>Event:</strong> ${e.eventName}</p>
      <p><strong>Date:</strong> ${e.eventDate}</p>
      <p><strong>Status:</strong> Draft (ready to publish)</p>
    </div>

    <h3>🚀 Next Steps</h3>
    <ul>
      <li>Review your event details</li>
      <li>Publish your event to make it visible to attendees</li>
      <li>Share your event with potential attendees</li>
      <li>Monitor ticket sales and analytics</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${e.managementUrl}" class="action-button">Manage Event</a>
      <a href="${e.eventUrl}" class="action-button">Preview Event</a>
    </div>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>💡 Pro Tip:</strong> Don't forget to publish your event when you're ready for attendees to purchase tickets!</p>
    </div>
  </div>

  <div class="footer">
    <p>Questions? Contact us at support@events.stepperslife.com</p>
    <p>\xa9 2024 SteppersLife Events. All rights reserved.</p>
  </div>
</body>
</html>`}generateEventReminderHTML(e,t,r,n){return`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Reminder - ${t}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Event Reminder</h1>
    <p>Don't miss your event tomorrow!</p>
  </div>

  <div class="content">
    <h2>Hi ${e}!</h2>

    <p>This is a friendly reminder that <strong>${t}</strong> is happening tomorrow!</p>

    <div class="highlight">
      <h3>📅 Event Details</h3>
      <p><strong>Event:</strong> ${t}</p>
      <p><strong>Date:</strong> ${r}</p>
      <p><strong>Venue:</strong> ${n}</p>
    </div>

    <h3>✅ What to Bring</h3>
    <ul>
      <li>Your ticket (digital or printed)</li>
      <li>Valid ID for entry</li>
      <li>Comfortable shoes for stepping!</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="#" class="button">View My Tickets</a>
    </div>

    <p>We can't wait to see you on the dance floor! 💃🕺</p>
  </div>

  <div class="footer">
    <p>Questions? Contact us at support@events.stepperslife.com</p>
    <p>\xa9 2024 SteppersLife Events. All rights reserved.</p>
  </div>
</body>
</html>`}generateVerificationHTML(e,t){return`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Account</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to SteppersLife Events!</h1>
  </div>

  <div class="content">
    <h2>Hi ${e}!</h2>

    <p>Thank you for signing up! To complete your registration and start exploring amazing events, please verify your email address.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${t}" class="button">Verify Email Address</a>
    </div>

    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #2563eb; font-size: 14px;">${t}</p>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>⏰ Important:</strong> This verification link will expire in 24 hours for your security.</p>
    </div>

    <p>If you didn't create an account with SteppersLife Events, you can safely ignore this email.</p>

    <p>Welcome to the community!<br>
    <strong>The SteppersLife Team</strong></p>
  </div>

  <div class="footer">
    <p>Questions? Contact us at support@events.stepperslife.com</p>
    <p>\xa9 2024 SteppersLife Events. All rights reserved.</p>
  </div>
</body>
</html>`}stripHtml(e){return e.replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim()}constructor(){this.fromEmail=process.env.RESEND_FROM_EMAIL||"noreply@events.stepperslife.com",this.fromName="SteppersLife Events"}}let S=new N}};
//# sourceMappingURL=6340.js.map