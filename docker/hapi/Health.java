// HAPI's default image is distroless: no shell, no curl. Java is the only tool
// inside, so the healthcheck is a single-file program run with `java Health.java`.
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class Health {
  public static void main(String[] args) {
    try {
      var request = HttpRequest.newBuilder(URI.create("http://localhost:8080/fhir/metadata"))
          .timeout(Duration.ofSeconds(5))
          .build();
      var response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.discarding());
      System.exit(response.statusCode() == 200 ? 0 : 1);
    } catch (Exception e) {
      System.exit(1);
    }
  }
}
