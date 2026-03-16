using Microsoft.AspNetCore.SignalR;

namespace TourMate.Backend.Hubs
{
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


        public async Task RespondToBooking(string touristEmail, string guideName, bool accepted)
        {
            string status = accepted ? "Accepted" : "Declined";
            await Clients.All.SendAsync("ReceiveBookingResponse", guideName, status);
        }

        public async Task NotifyReviewSubmitted(int guideUserId, string touristName, int rating, string comment)
        {
            await Clients.All.SendAsync("ReceiveReviewUpdate", new
            {
                guideUserId,
                touristName,
                rating,
                reviewComment = comment,
                completedDate = DateTime.Now
            });
        }

        public async Task NotifyStatusChange(int guideUserId, bool isOnline, double? lat, double? lon)
        {
            await Clients.All.SendAsync("ReceiveStatusUpdate", new
            {
                guideUserId,
                isOnline,
                latitude = lat,
                longitude = lon
            });
        }
    }
}