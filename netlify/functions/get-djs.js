const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    // This is the direct and correct endpoint for fetching a list of all DJ personas.
    const personasUrl = `https://spinitron.com/api/personas?access-token=${spinitronApiKey}&station=kuaa&count=200`;

    try {
        const response = await fetch(personasUrl, { timeout: 9000 });
        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify({ error: `Spinitron API error: ${response.statusText}` }) };
        }

        const data = await response.json();

        // Map the data to the format the frontend expects (name, bio, image at the top level).
        const djsArray = data.items.map(dj => ({
            id: dj.id,
            name: dj.attributes.name,
            bio: dj.attributes.bio,
            image: dj.attributes.image
        }));

        const responseData = {
            items: djsArray
        };

        return {
            statusCode: 200,
            body: JSON.stringify(responseData)
        };
    } catch (error) {
        console.error("Error in get-djs function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
