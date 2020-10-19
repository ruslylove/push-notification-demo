const subscriptions = {};
var crypto = require("crypto");
const webpush = require("web-push");

const vapidKeys = {
  privateKey: "bdSiNzUhUP6piAxLH-tW88zfBlWWveIx0dAsDO66aVU",
  publicKey: "BIN2Jc5Vmkmy-S3AUrcMlpKxJpLeVRAfu9WBqUbJ70SJOCWGCGXKY-Xzyh7HDr6KbRDGYHjqZ06OcS3BjD7uAm8"
};

webpush.setVapidDetails("mailto:example@yourdomain.org", vapidKeys.publicKey, vapidKeys.privateKey);

function createHash(input) {
  const md5sum = crypto.createHash("md5");
  md5sum.update(Buffer.from(input));
  return md5sum.digest("hex");
}

function handlePushNotificationSubscription(req, res) {
  const subscriptionRequest = req.body;
  const susbscriptionId = createHash(JSON.stringify(subscriptionRequest));
  subscriptions[susbscriptionId] = subscriptionRequest;
  res.status(201).json({ id: susbscriptionId });
}

function sendPushNotification(req, res) {
  const subscriptionId = req.params.id;
  const pushSubscription = subscriptions[subscriptionId];
  webpush
    .sendNotification(
      pushSubscription,
      JSON.stringify({
        title: "Test TLM Alert!",
        text: "TLM 101, Over VTHD!",
        image: "/android-chrome-192x192.png",
        tag: "new-product",
        url: "https://csb-14wi2-ivh5lchgc.vercel.app/"
      })
    )
    .catch(err => {
      console.log(err);
    });

  res.status(202).json({});
}

function sendAllPushNotification(req, res) {
  const message = req.body;

  let text = "TLM_ID: " + message.tlm_id;
  // over vthd
  if (message.ph1_vthd) {
    text += ", VTHD: " + Math.max(message.ph1_vthd, message.ph2_vthd, message.ph3_vthd).toFixed(2);
  }
  // over ithd
  if (message.ph1_ithd) {
    text += ", ITHD: " + Math.max(message.ph1_ithd, message.ph2_ithd, message.ph3_ithd).toFixed(2);
  }

  for (let id in subscriptions) {
    const pushSubscription = subscriptions[id];
    webpush
      .sendNotification(
        pushSubscription,
        JSON.stringify({
          title: "TLM: " + new Date(message.time * 1000 - 7 * 60 * 60 * 1000),
          text: text,
          image: "/android-chrome-192x192.png",
          tag: "tlm-thd",
          url: "https://csb-14wi2-ivh5lchgc.vercel.app/"
        })
      )
      .catch(err => {
        console.log(err);
      });
  }

  res.status(202).json({});
}


module.exports = { handlePushNotificationSubscription, sendPushNotification, sendAllPushNotification };
