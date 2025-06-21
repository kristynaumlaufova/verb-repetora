using BE.Controllers;

namespace BE.Services;

public class FsrsParametersUpdateService(
    IServiceProvider serviceProvider,
    ILogger<FsrsParametersUpdateService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;

            // Calculate time until next 2:00 AM
            var nextRun = now.Hour >= 2
                ? now.Date.AddDays(1).AddHours(2)
                : now.Date.AddHours(2);

            var delay = nextRun - now;

            await Task.Delay(delay, stoppingToken);

            if (stoppingToken.IsCancellationRequested)
                break;

            try
            {
                using var scope = serviceProvider.CreateScope();
                var reviewLogController = scope.ServiceProvider.GetRequiredService<ReviewLogController>();

                await reviewLogController.UpdateParameters();

                logger.LogInformation("FSRS weights update process completed at {Time}", DateTimeOffset.Now);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred while updating FSRS weights");
            }
        }
    }
}
