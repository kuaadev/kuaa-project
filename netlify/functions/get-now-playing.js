const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const spinitronApiKey = process.env.SPINITRON_API_KEY;
    if (!spinitronApiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Spinitron API key is not configured." }) };
    }

    const spinsUrl = `https://spinitron.com/api/spins?access-token=${spinitronApiKey}&station=kuaa&count=1&with=show,personas`;

    try {
        const spinsResponse = await fetch(spinsUrl);
        if (!spinsResponse.ok) { throw new Error('Failed to fetch spins.'); }
        const spinsData = await spinsResponse.json();

        // Case 1: A song is actively playing (live DJ or playlist)
        if (spinsData.items && spinsData.items.length > 0) {
            const latestSpin = spinsData.items[0];
            const responseData = {
                song: latestSpin.song || 'Music Variety',
                artist: latestSpin.artist || 'Various Artists',
                release: latestSpin.release || 'KUAA',
                image: latestSpin.image,
                show: latestSpin.show || { title: 'Community Programming', personas: [] }
            };
            return { statusCode: 200, body: JSON.stringify(responseData) };
        }

        // Case 2: No active song, likely automation. Fetch the current show instead.
        const showsUrl = `https://spinitron.com/api/shows?access-token=${spinitronApiKey}&station=kuaa&count=1&with=personas`;
        const showsResponse = await fetch(showsUrl);
        if (!showsResponse.ok) { throw new Error('Failed to fetch shows.'); }
        const showsData = await showsResponse.json();

        if (showsData.items && showsData.items.length > 0) {
            const currentShow = showsData.items[0];
            const responseData = {
                song: 'Automated Mix',
                artist: 'KUAA',
                release: 'Salt Lake City',
                image: null,
                show: {
                    title: currentShow.title || 'Community Programming',
                    personas: currentShow.personas || []
                }
            };
            return { statusCode: 200, body: JSON.stringify(responseData) };
        }

        // Fallback if nothing can be fetched
        throw new Error("No spin or show data available.");

    } catch (error) {
        console.error("Error in get-now-playing function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
