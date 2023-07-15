const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
require("dotenv").config();

const app = express();
app.use(express.json());

// Facebook app credentials
const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const REDIRECT_URI = "http://localhost:5000/auth/facebook/callback";

app.get("/login", (req, res) => {
  const params = {
    client_id: APP_ID,
    redirect_uri: REDIRECT_URI,
  };
  const url = `https://www.facebook.com/v17.0/dialog/oauth?${querystring.stringify(
    params
  )}`;
  res.redirect(url);
});

app.get("/auth/facebook/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const accessTokenResponse = await axios.get(
      "https://graph.facebook.com/v17.0/oauth/access_token",
      {
        params: {
          client_id: APP_ID,
          client_secret: APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code,
        },
      }
    );

    const { access_token } = accessTokenResponse.data;

    try {
      const longLivedAccessTokenResponse = await axios.get(
        "https://graph.facebook.com/v13.0/oauth/access_token",
        {
          params: {
            grant_type: "fb_exchange_token",
            client_id: APP_ID,
            client_secret: APP_SECRET,
            fb_exchange_token: access_token,
          },
        }
      );

      const longLivedAccessToken = longLivedAccessTokenResponse.data.access_token;

      const pagesResponse = await axios.get(
        "https://graph.facebook.com/v17.0/me/accounts",
        {
          params: {
            access_token: longLivedAccessToken,
          },
        }
      );

      const pages = pagesResponse.data.data;
      const pageAccessToken = pages[0].access_token;
      console.log(pageAccessToken);
      console.log(pages[0].id);

      res.send("Successfully connected to Facebook.");
    } catch (error) {
      console.log(error);
      res.status(500).send("Error fetching Pages.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error connecting to Facebook.");
  }
});



// Post a message to a Facebook Page
app.post("/post", async (req, res) => {
  const { access_token, page_id, message,url } = req.body;

  try {
    await axios.post(`https://graph.facebook.com/${page_id}/photos`, {
      url,
      message,
      access_token,
    });

    res.send("Message posted successfully.");
  } catch (error) {
    res.status(500).send(error);
  }
});

// Start the server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
