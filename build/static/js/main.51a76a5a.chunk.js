(this["webpackJsonpyks-smart-bot"]=this["webpackJsonpyks-smart-bot"]||[]).push([[0],{33:function(e,t,n){},58:function(e,t,n){"use strict";n.r(t);var c=n(1),r=n.n(c),s=n(23),i=n.n(s),a=(n(33),n(7)),o=n(0),j=function(e){return Object(o.jsx)("header",{children:e.children})},l=n(18),d=n.n(l),u=n(24),h=n(17),b=n.n(h),O=n(25),p=n.n(O),x=function(e,t){return p()("".concat("http://localhost:3000","/api/login"),{method:"POST",signal:t,headers:{"Content-Type":"application/json"},body:'{ "code": "'.concat(e,'" }')}).then((function(e){return e.json()})).catch((function(e){return console.error(e)}))},f=function(e){var t=e.setSession,n=e.setUser,r=Object(c.useState)(null),s=Object(a.a)(r,2),i=s[0],j=s[1],l=new AbortController,h=l.signal;if(Object(c.useEffect)(Object(u.a)(d.a.mark((function e(){var c;return d.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!i){e.next=6;break}return e.next=3,x(i,h);case 3:c=e.sent,console.log(c),c&&c.user&&c.sessionId&&(t(c.sessionId),n(c.user));case 6:return e.abrupt("return",(function(){return l.abort()}));case 7:case"end":return e.stop()}}),e)})))),i)return Object(o.jsx)("main",{children:Object(o.jsx)("h1",{children:"Working......"})});var O,p=null===(O={location:location}.location)||void 0===O?void 0:O.search,f=p?b.a.parse(p):null;return(null===f||void 0===f?void 0:f.code)&&j(f.code),Object(o.jsx)("main",{children:Object(o.jsx)("a",{href:"https://discord.com/api/oauth2/authorize?client_id=793020735265308673&redirect_uri=https%3A%2F%2Fyks-smart-bot-dev.herokuapp.com&response_type=code&scope=identify%20guilds",children:"Login"})})},g=function(e){return Object(o.jsx)("nav",{children:e.children})},v=n(12),m=function(e){return Object(o.jsx)(v.b,{to:e.href,className:e.id,children:e.children})},k=function(e){return Object(o.jsx)("h1",{children:e.children})},C=function(e){return Object(o.jsx)("main",{children:e.children})},z=function(e){return null},S=n(21),y=n(27),E=n(28),F=n.n(E),M=function(e){var t=e.pageCount,n=e.onPageChange;return Object(o.jsx)(F.a,{previousLabel:"previous",nextLabel:"next",breakLabel:"...",marginPagesDisplayed:2,pageRangeDisplayed:5,containerClassName:"paginator",pageCount:t,onPageChange:n})},P=function(e){var t=Object(c.useState)(null),n=Object(a.a)(t,2),r=n[0],s=n[1],i=Object(c.useState)([]),j=Object(a.a)(i,2),l=j[0],d=j[1],u=Object(c.useState)(0),h=Object(a.a)(u,2),b=h[0],O=h[1],p=Object(c.useState)(0),x=Object(a.a)(p,2),f=x[0],g=x[1],v=function(e){var t=1*e.selected,n=Object(S.a)(r);n=n.slice(t,t+1),g(e.selected),d(n)};r||fetch("".concat("http://localhost:3000","/api/clips"),{method:"GET",headers:{"Content-Type":"application/json"}}).then((function(e){return e.json()})).catch((function(e){return console.error(e)})).then((function(e){if(e){O(Math.ceil(e.clips.length/1)),s(e.clips);var t=1*f,n=Object(S.a)(e.clips);n=n.slice(t,t+1),d(n)}}));return Object(o.jsxs)(o.Fragment,{children:[Object(o.jsx)(M,{pageCount:b,onPageChange:v}),Object(o.jsx)("div",{className:"main clips",children:null===l||void 0===l?void 0:l.map((function(e,t){return Object(o.jsx)("video",{className:"clip",controls:!0,children:Object(o.jsx)("source",{src:e})},Object(y.uniqueId)())}))}),Object(o.jsx)(M,{pageCount:b,onPageChange:v})]})},w=function(e){return Object(o.jsx)("h1",{children:"Episodes"})},B=function(e){return Object(o.jsx)("h1",{children:"RealOrFake"})},I=function(e){return Object(o.jsx)("h1",{children:"Mailbag"})},L=function(e){return Object(o.jsx)("h1",{children:"Buzzer"})},N=n(2),R=function(e){var t=Object(c.useState)(),n=Object(a.a)(t,2),r=n[0],s=n[1],i=Object(c.useState)(),l=Object(a.a)(i,2),d=l[0],u=l[1];return r&&d?Object(o.jsx)(v.a,{children:Object(o.jsxs)("div",{className:"App",children:[Object(o.jsxs)(j,{children:[Object(o.jsx)(k,{children:"YKS Smart Bot Mainframe"}),Object(o.jsx)(m,{id:"header-logout",href:"",children:"Logout"})]}),Object(o.jsxs)(g,{children:[Object(o.jsx)(m,{id:"nav-episodes",href:"episodes",children:"Episodes"}),Object(o.jsx)(m,{id:"nav-clips",href:"clips",children:"Clips"}),Object(o.jsx)(m,{id:"nav-realorfake",href:"real-or-fake",children:"Real or Fake?"}),Object(o.jsx)(m,{id:"nav-mailbag",href:"mailbag",children:"Mailbag"}),Object(o.jsx)(m,{id:"nav-buzzer",href:"buzzer",children:"Buzzer"})]}),Object(o.jsx)(C,{children:Object(o.jsxs)(N.c,{children:[Object(o.jsxs)(N.a,{path:"/episodes",children:[Object(o.jsx)(k,{children:"Episodes"}),Object(o.jsx)(w,{})]}),Object(o.jsxs)(N.a,{path:"/clips",children:[Object(o.jsx)(k,{children:"Clips"}),Object(o.jsx)(P,{user:d,sessionId:r})]}),Object(o.jsxs)(N.a,{path:"/real-or-fake",children:[Object(o.jsx)(k,{children:"Real or Fake"}),Object(o.jsx)(B,{})]}),Object(o.jsxs)(N.a,{path:"/mailbag",children:[Object(o.jsx)(k,{children:"Mailbag"}),Object(o.jsx)(I,{})]}),Object(o.jsxs)(N.a,{path:"/buzzer",children:[Object(o.jsx)(k,{children:"Buzzer"}),Object(o.jsx)(L,{})]})]})}),Object(o.jsx)(z,{})]})}):Object(o.jsx)(f,{setSession:s,setUser:u})};i.a.render(Object(o.jsx)(r.a.StrictMode,{children:Object(o.jsx)(R,{})}),document.getElementById("root"))}},[[58,1,2]]]);
//# sourceMappingURL=main.51a76a5a.chunk.js.map