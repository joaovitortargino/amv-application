package br.com.oficina.infrastructure.integration.itau;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.core5.ssl.SSLContextBuilder;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.SSLContext;
import java.io.InputStream;
import java.security.KeyStore;

@Configuration
public class ItauRestTemplateConfig {

    @Value("${itau.mtls.enabled:false}")
    private boolean mtlsEnabled;

    @Value("${itau.ssl.key-store:#{null}}")
    private Resource keyStore;

    @Value("${itau.ssl.key-store-password:#{null}}")
    private String keyStorePassword;

    @Bean
    @Qualifier("itauRestTemplate")
    public RestTemplate itauRestTemplate() throws Exception {
        if (mtlsEnabled) {
            // --- LÓGICA PARA PRODUÇÃO (COM CERTIFICADO) ---
            if (keyStore == null || !keyStore.exists()) {
                throw new IllegalStateException("mTLS is enabled, but 'itau.ssl.key-store' is not configured or the file does not exist.");
            }

            KeyStore ks = KeyStore.getInstance("PKCS12");
            try (InputStream is = keyStore.getInputStream()) {
                ks.load(is, keyStorePassword.toCharArray());
            }

            SSLContext sslContext = SSLContextBuilder.create()
                    .loadKeyMaterial(ks, keyStorePassword.toCharArray())
                    .build();

            SSLConnectionSocketFactory socketFactory = new SSLConnectionSocketFactory(sslContext);

            CloseableHttpClient httpClient = HttpClients.custom()
                    .setConnectionManager(PoolingHttpClientConnectionManagerBuilder.create()
                            .setSSLSocketFactory(socketFactory)
                            .build())
                    .build();

            HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);
            return new RestTemplate(factory);
        } else {
            // --- LÓGICA PARA SANDBOX (SEM CERTIFICADO) ---
            return new RestTemplate();
        }
    }
}
