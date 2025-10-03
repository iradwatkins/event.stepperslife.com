try{!function(){var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},t=(new e.Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="59655949-1873-46a3-a2bb-774ac516f1de",e._sentryDebugIdIdentifier="sentry-dbid-59655949-1873-46a3-a2bb-774ac516f1de")}()}catch(e){}"use strict";exports.id=7334,exports.ids=[7334],exports.modules={29767:(e,t,r)=>{r.d(t,{OG:()=>s,vV:()=>n});var a=r(26092);let i=process.env.SENTRY_DSN;function n(e,t){i&&a.withScope(r=>{t?.user&&r.setUser(t.user),t?.extra&&Object.entries(t.extra).forEach(([e,t])=>{r.setExtra(e,t)}),t?.tags&&Object.entries(t.tags).forEach(([e,t])=>{r.setTag(e,t)}),t?.level&&r.setLevel(t.level),a.captureException(e)})}function s(e,t="info",r){i&&a.withScope(i=>{r?.user&&i.setUser(r.user),r?.extra&&Object.entries(r.extra).forEach(([e,t])=>{i.setExtra(e,t)}),r?.tags&&Object.entries(r.tags).forEach(([e,t])=>{i.setTag(e,t)}),i.setLevel(t),a.captureMessage(e)})}},99521:(e,t,r)=>{r.d(t,{DN:()=>s});var a=r(22255),i=r(96330);class n{async checkTransferEligibility(e){let{ticketId:t,userId:r}=e,i=await a.prisma.ticket.findUnique({where:{id:t},include:{order:{include:{event:!0}}}});if(!i)return{eligible:!1,reason:"Ticket not found"};if(i.userId!==r)return{eligible:!1,reason:"You do not own this ticket"};if("VALID"!==i.status)return{eligible:!1,reason:`Ticket cannot be transferred (status: ${i.status})`};if(i.checkedInAt)return{eligible:!1,reason:"Ticket has already been used for check-in"};let n=new Date,s=(new Date(i.order.event.startDate).getTime()-n.getTime())/36e5;if(s<0)return{eligible:!1,reason:"Event has already occurred"};if(s<24)return{eligible:!1,reason:"Transfers not allowed within 24 hours of event"};let o=await a.prisma.$queryRaw`
      SELECT * FROM ticket_transfers
      WHERE "ticketId" = ${t}
      AND status = 'PENDING'
      LIMIT 1
    `;if(o&&o.length>0)return{eligible:!1,reason:"A transfer is already pending for this ticket"};let u=await a.prisma.$queryRaw`
      SELECT COUNT(*) as count FROM ticket_transfers
      WHERE "ticketId" = ${t}
      AND status = 'ACCEPTED'
    `;return(u[0]?.count||0)>=3?{eligible:!1,reason:"Maximum transfer limit reached (3 transfers per ticket)"}:{eligible:!0}}async initiateTransfer(e){let{ticketId:t,fromUserId:r,toEmail:i,message:n}=e,s=await this.checkTransferEligibility({ticketId:t,userId:r});if(!s.eligible)throw Error(s.reason||"Transfer not allowed");let o=await a.prisma.user.findUnique({where:{id:r}});if(o?.email.toLowerCase()===i.toLowerCase())throw Error("Cannot transfer ticket to yourself");let u=await a.prisma.ticket.findUnique({where:{id:t},include:{order:{include:{event:!0}}}});if(!u)throw Error("Ticket not found");let d=await a.prisma.user.findUnique({where:{email:i.toLowerCase()}}),c=new Date;return c.setHours(c.getHours()+48),await a.prisma.$executeRaw`
      INSERT INTO ticket_transfers (
        id, "ticketId", "fromUserId", "toEmail", "toUserId",
        status, message, "oldQrCode", "expiresAt"
      )
      VALUES (
        gen_random_uuid()::text,
        ${t},
        ${r},
        ${i.toLowerCase()},
        ${d?.id||null},
        'PENDING',
        ${n||null},
        ${u.qrCode},
        ${c}
      )
    `,{id:(await a.prisma.$queryRaw`
      SELECT * FROM ticket_transfers
      WHERE "ticketId" = ${t}
      AND status = 'PENDING'
      ORDER BY "initiatedAt" DESC
      LIMIT 1
    `)[0].id,status:"PENDING",ticket:u,fromUser:o,toEmail:i,toUser:d||void 0,message:n||void 0,expiresAt:c,initiatedAt:new Date}}async acceptTransfer(e){let{transferId:t,userId:r}=e,n=await a.prisma.$queryRaw`
      SELECT * FROM ticket_transfers
      WHERE id = ${t}
      LIMIT 1
    `;if(!n||0===n.length)throw Error("Transfer not found");let s=n[0];if("PENDING"!==s.status)throw Error(`Transfer cannot be accepted (status: ${s.status})`);if(new Date>new Date(s.expiresAt))throw await a.prisma.$executeRaw`
        UPDATE ticket_transfers
        SET status = 'EXPIRED'
        WHERE id = ${t}
      `,Error("Transfer has expired");let o=await a.prisma.user.findUnique({where:{id:r}});if(!o||o.email.toLowerCase()!==s.toEmail.toLowerCase())throw Error("Unauthorized to accept this transfer");let u=await a.prisma.ticket.findUnique({where:{id:s.ticketId},include:{order:{include:{event:!0}}}});if(!u)throw Error("Ticket not found");return await a.prisma.$transaction(async e=>{let a=`QR-${Date.now()}-${Math.random().toString(36).substr(2,8)}`,n=`VAL-${Math.random().toString(36).substr(2,12).toUpperCase()}`;return await e.ticket.update({where:{id:s.ticketId},data:{userId:r,holderName:`${o.firstName||""} ${o.lastName||""}`.trim()||o.email,holderEmail:o.email,qrCode:a,validationCode:n,status:i.TicketStatus.VALID}}),await e.$executeRaw`
        UPDATE ticket_transfers
        SET status = 'ACCEPTED',
            "acceptedAt" = NOW(),
            "toUserId" = ${r},
            "newQrCode" = ${a}
        WHERE id = ${t}
      `,await e.auditLog.create({data:{action:"TICKET_TRANSFERRED",entityType:"TICKET",entityId:s.ticketId,userId:r,metadata:{fromUserId:s.fromUserId,toUserId:r,transferId:t,oldQrCode:s.oldQrCode,newQrCode:a}}}),{transfer:s,ticket:u,newQrCode:a,user:o}})}async declineTransfer(e){let{transferId:t,userId:r,reason:i}=e,n=await a.prisma.$queryRaw`
      SELECT * FROM ticket_transfers
      WHERE id = ${t}
      LIMIT 1
    `;if(!n||0===n.length)throw Error("Transfer not found");let s=n[0],o=await a.prisma.user.findUnique({where:{id:r}});if(!o||o.email.toLowerCase()!==s.toEmail.toLowerCase())throw Error("Unauthorized to decline this transfer");if("PENDING"!==s.status)throw Error(`Transfer cannot be declined (status: ${s.status})`);await a.prisma.$executeRaw`
      UPDATE ticket_transfers
      SET status = 'DECLINED',
          "declinedAt" = NOW()
      WHERE id = ${t}
    `}async cancelTransfer(e){let{transferId:t,userId:r}=e,i=await a.prisma.$queryRaw`
      SELECT * FROM ticket_transfers
      WHERE id = ${t}
      LIMIT 1
    `;if(!i||0===i.length)throw Error("Transfer not found");let n=i[0];if(n.fromUserId!==r)throw Error("Unauthorized to cancel this transfer");if("PENDING"!==n.status)throw Error(`Transfer cannot be cancelled (status: ${n.status})`);await a.prisma.$executeRaw`
      UPDATE ticket_transfers
      SET status = 'CANCELLED'
      WHERE id = ${t}
    `}async getTransferById(e){let t=await a.prisma.$queryRaw`
      SELECT * FROM ticket_transfers
      WHERE id = ${e}
      LIMIT 1
    `;return t&&t.length>0?t[0]:null}async getTicketTransfers(e){return await a.prisma.$queryRaw`
      SELECT * FROM ticket_transfers
      WHERE "ticketId" = ${e}
      ORDER BY "initiatedAt" DESC
    `}async processExpiredTransfers(){let e=new Date,t=await a.prisma.$queryRaw`
      SELECT * FROM ticket_transfers
      WHERE status = 'PENDING'
      AND "expiresAt" < ${e}
    `,r=[],i=0;for(let e of t)try{await a.prisma.$executeRaw`
          UPDATE ticket_transfers
          SET status = 'EXPIRED'
          WHERE id = ${e.id}
        `,i++}catch(t){r.push(`Failed to expire transfer ${e.id}: ${t}`)}return{processed:i,errors:r}}}let s=new n},99246:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{isNotFoundError:function(){return i},notFound:function(){return a}});let r="NEXT_NOT_FOUND";function a(){let e=Error(r);throw e.digest=r,e}function i(e){return"object"==typeof e&&null!==e&&"digest"in e&&e.digest===r}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},30241:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"createDedupedByCallsiteServerErrorLoggerDev",{enumerable:!0,get:function(){return u}});let a=function(e,t){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var r=i(void 0);if(r&&r.has(e))return r.get(e);var a={__proto__:null},n=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var s in e)if("default"!==s&&Object.prototype.hasOwnProperty.call(e,s)){var o=n?Object.getOwnPropertyDescriptor(e,s):null;o&&(o.get||o.set)?Object.defineProperty(a,s,o):a[s]=e[s]}return a.default=e,r&&r.set(e,a),a}(r(72801));function i(e){if("function"!=typeof WeakMap)return null;var t=new WeakMap,r=new WeakMap;return(i=function(e){return e?r:t})(e)}let n={current:null},s="function"==typeof a.cache?a.cache:e=>e,o=console.warn;function u(e){return function(...t){o(e(...t))}}s(e=>{try{o(n.current)}finally{n.current=null}})}};
//# sourceMappingURL=7334.js.map