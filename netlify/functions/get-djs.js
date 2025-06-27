const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    const showsUrl = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=200&with=personas`;

    try {
        const response = await fetch(showsUrl, { timeout: 9000 });
        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify({ error: `Spinitron API error: ${response.statusText}` }) };
        }
        const data = await response.json();

        let djs = [];
        // Per JSON:API spec, related resources are in the 'included' array.
        if (data.included && Array.isArray(data.included)) {
            // Filter to only include items of type 'personas'
            djs = data.included.filter(item => item.type === 'personas');
        }

        // The front-end expects an object with an 'items' property.
        // We also map the attributes to the top level for easier use in the djs.html page.
        const responseData = {
            items: djs.map(dj => ({
                id: dj.id,
                name: dj.attributes.name,
                bio: dj.attributes.bio,
                image: dj.attributes.image
            }))
        };

        return {
            statusCode: 200,
            body: JSON.stringify(responseData)
        };
    } catch (error) {
        console.error("Error in get-djs function:", error);
        if (error.type === 'request-timeout') {
            return { statusCode: 504, body: JSON.stringify({ error: "Gateway timeout: The Spinitron API took too long to respond." }) };
        }
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
