const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    // The public JSON stats URL for the Icecast stream
    const streamStatsUrl = 'https://stream.xmission.com/status-json.xsl';

    try {
        const response = await fetch(streamStatsUrl);
        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify({ error: "Could not fetch stream stats." }) };
        }
        const data = await response.json();

        // Find the correct mountpoint for KUAA
        const mountpoint = data.icestats.source.find(s => s.listenurl.includes('kuaa'));

        if (!mountpoint || !mountpoint.listeners) {
            return { statusCode: 200, body: JSON.stringify([]) }; // No listeners or mountpoint not found
        }

        // We can't geolocate IPs on the server-side without an API key for a geolocation service.
        // Instead, we will pass the raw list back and let the front-end decide how to handle it,
        // or just display the count. For this demo, we'll just send back the count.
        // A full implementation would use a service like geo.ipify.org or ipstack.com here.

        const listenerCount = mountpoint.listeners;
        const listenerInfo = {
            count: listenerCount,
            // In a real application, you would process and geolocate listener IPs here.
            // For this example, we are just returning a count.
        };

        return {
            statusCode: 200,
            body: JSON.stringify(listenerInfo)
        };
    } catch (error) {
        console.error("Error fetching listener data:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "An internal error occurred." }) };
    }
};
