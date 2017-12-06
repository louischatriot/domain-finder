const cp = require('child_process')
    , fs = require('fs')
    , os = require('os')
    , eol = os.EOL
    , async = require('async')
    ;

var _data = fs.readFileSync('to-try.txt', 'utf8');
var data = _data.split(eol);
var results = [];
var eolToString = eol === '\n' ? '\\n' : '\\r\\n';


if (!data || data.length === 0) {
  console.log("No data, stopping process");
  process.exit(0);
}

if (data[data.length - 1].length === 0) {
  data.splice(data.length - 1);
}

// Choose any extension you want or scan for multiple extensions
data = data.map(d => d + ".com");


async.eachOfSeries(data, function (domain, k, cb) {
  process.stdout.write("Analyzing domain " + domain + " ...");

  // Query primary WHOIS server
  cp.exec("whois " + domain, {}, function (err, sout, serr) {
    if (sout.match(/No match for/)) {
      console.log("free");
      results.push({ domain: domain, available: 'yes' });
      return cb();
    } else {
      console.log("taken");

      // Find and query registrar WHOIS server
      var registrarWHOIS = sout.match(new RegExp("Registrar WHOIS Server: ([^" + eolToString + "]*)"));
      registrarWHOIS = registrarWHOIS ? (registrarWHOIS[1] ? (registrarWHOIS[1].length > 0 ? registrarWHOIS[1] : '') : '') : '';

      if (registrarWHOIS === '') {
        results.push({ domain: domain, available: 'no' });
        return cb();
      }

      cp.exec("whois " + domain + " -h " + registrarWHOIS , {}, function (err, sout, serr) {
        var org = sout.match(new RegExp("Registrant Organization: ([^" + eolToString + "]*)"))
          , phone = sout.match(new RegExp("Registrant Phone: ([^" + eolToString + "]*)"))
          , email = sout.match(new RegExp("Registrant Email: ([^" + eolToString + "]*)"))
          ;

        org = org ? (org[1] ? (org[1].length > 0 ? org[1] : '') : '') : '';
        phone = phone ? (phone[1] ? (phone[1].length > 0 ? phone[1] : '') : '') : '';
        email = email ? (email[1] ? (email[1].length > 0 ? email[1] : '') : '') : '';

        results.push({ domain: domain, available: "no", regOrg: org, regPhone: phone, regEmail: email });
        return cb();
      });
    }
  });
}, function afterRun (err) {
  console.log("=========================");
  console.log("Done with domain scraping");
  console.log(results);
});





