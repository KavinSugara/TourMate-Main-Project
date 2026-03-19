import * as signalR from "@microsoft/signalr";
export const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5211/tourmatehub", {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information) 
    .build();

export const startConnection = async (onMessageReceived) => {
    if (connection.state === signalR.HubConnectionState.Disconnected) {
        try {
            console.log("🚀 SignalR: Attempting direct WebSocket connection...");
            await connection.start();
            console.log("✅ SignalR Connected!");

            connection.off("ReceiveBookingRequest");

            connection.on("ReceiveBookingRequest", (data) => {
                console.log("🔔 SignalR Service: Raw data received", data);
                onMessageReceived(data); 
            });

        } catch (err) {
            console.error("❌ SignalR Connection Error: ", err);
        }
    } else {
        console.log("ℹ️ SignalR: Connection state is currently:", connection.state);
    }
};

export const getConnectionState = () => connection.state;