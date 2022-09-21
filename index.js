// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })
const AWS = require('aws-sdk');
const { v4: uuid } = require('uuid');
const fastifyIO = require("fastify-socket.io");

fastify.register(fastifyIO,  {
    cors: {
        origin: "http://localhost:3000",
        credentials: false
    }
});


// You must use "us-east-1" as the region for Chime API and set the endpoint.
// Declare a route
fastify.get('/room/open', async (request, reply) => {
    try {
        const chime = new AWS.Chime({ region: 'us-east-1' });
        chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com');

        const meetingResponse = await chime.createMeeting({
            ClientRequestToken: uuid(),
            MediaRegion: 'us-west-2' // Specify the region in which to create the meeting.
        }).promise();

        const attendeeResponse = await chime.createAttendee({
            MeetingId: meetingResponse.Meeting.MeetingId,
            ExternalUserId: uuid() // Link the attendee to an identity managed by your application.
        }).promise();

        fastify.log.info(meetingResponse);
    } catch (err) {
        console.error('ERR', err);
    }

    return { hello: 'world' }
})

/* fastify.get('/room/join/:jwt', async (request, reply) => {
    fastify.io.on("connection", (socket) => {
        console.log(socket);
        console.log('connected');
    });
}) */

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: 8000 })

    await fastify.ready();
    
    fastify.io.on("connection", (socket) => {
        
        socket.on("jwt", (jwt) => {
            console.log('JWT', jwt);
        });

        fastify.io.emit('data', { type: 'require', property: 'jwt' })
    });

  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()