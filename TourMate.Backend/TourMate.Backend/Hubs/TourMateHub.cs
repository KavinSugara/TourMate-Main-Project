using Microsoft.AspNetCore.SignalR;

namespace TourMate.Backend.Hubs
{
    public class TourMateHub : Hub
    {
        // 1. Initial Booking Request (Directed to specific Guide)
        public async Task RequestGuide(string guideId, string touristName)
        {
            await Clients.User(guideId).SendAsync("ReceiveRequest", touristName);
        }

        // 2. Chat messaging (General broadcast)
        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }

        // 3. Respond to Booking (Broadcast response to update Tourist UI)
        public async Task RespondToBooking(string touristEmail, string guideName, bool accepted)
        {
            string status = accepted ? "Accepted" : "Declined";
            await Clients.All.SendAsync("ReceiveBookingResponse", guideName, status);
        }

        // 4. Real-time Feedback Sync (Broadcast new review to Guide Dashboard)
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

        // 5. Visibility Sync (Broadcast status when Guide goes Online/Offline)
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

        // 6. EMERGENCY SOS (Broadcast critical safety alert with location data)
        public async Task SendSOS(string touristName, double lat, double lon, string guideName)
        {
            await Clients.All.SendAsync("ReceiveSOSAlert", new
            {
                touristName,
                latitude = lat,
                longitude = lon,
                guideName,
                timestamp = DateTime.Now
            });
        }
    }
}