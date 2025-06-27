const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    const spinsUrl = `https://spinitron.com/api/spins?access-token=${spinitronApiKey}&station=kuaa&count=1`;
    const showsUrl = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=1&with=personas`;

    try {
        // Fetch both the current spin and the current show in parallel for maximum accuracy
        const [spinsResponse, showsResponse] = await Promise.all([
            fetch(spinsUrl),
            fetch(showsUrl)
        ]);

        if (!spinsResponse.ok || !showsResponse.ok) {
            throw new Error("Failed to fetch data from Spinitron.");
        }

        const spinsData = await spinsResponse.json();
        const showsData = await showsResponse.json();

        const latestSpin = (spinsData.items && spinsData.items.length > 0) ? spinsData.items[0] : {};
        const currentShow = (showsData.items && showsData.items.length > 0) ? showsData.items[0] : {};

        // Combine the data, always using the /shows endpoint for the official show and DJ info
        const responseData = {
            song: latestSpin.song || "Music Variety",
            artist: latestSpin.artist || "KUAA",
            release: latestSpin.release,
            image: latestSpin.image,
            show: currentShow // This is the key change for accuracy
        };

        return {
            statusCode: 200,
            body: JSON.stringify(responseData)
        };
    } catch (error) {
        console.error("Error in get-now-playing function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
