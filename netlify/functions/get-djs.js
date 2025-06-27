Of course.Here is the code for the`get-djs.js` serverless function.

This function fetches the list of all DJ "personas" from the Spinitron API, which you can then use to display on your DJs page.

```javascript
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    const spinitronApiUrl = `https://spinitron.com/api/personas?access-token=${spinitronApiKey}&station=kuaa&count=100`;

try {
    const response = await fetch(spinitronApiUrl);
    if (!response.ok) {
        return { statusCode: response.status, body: JSON.stringify({ error: `Spinitron API error: ${response.statusText}` }) };
    }
    const data = await response.json();
    return {
        statusCode: 200,
        body: JSON.stringify(data)
    };
} catch (error) {
    console.error("Error in get-djs function:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
}
};
```