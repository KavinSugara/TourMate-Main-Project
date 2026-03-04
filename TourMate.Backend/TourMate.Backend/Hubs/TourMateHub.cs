namespace TourMate.Backend.Hubs
{
    using Microsoft.AspNetCore.SignalR;

    public class TourMateHub : Hub
    {
        public async Task RequestGuide(string guideId, string touristName)
        {
            await Clients.User(guideId).SendAsync("ReceiveRequest", touristName);
        }

        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }
}
