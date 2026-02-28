package br.com.oficina.shared.utils;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.util.Base64;

@Component
public class ImageUtils {

    /**
     * Carrega uma imagem do classpath (resources) e converte para uma string Base64.
     * @param path Caminho relativo dentro de resources (ex: "static/images/logo.png")
     * @return String Base64 da imagem ou null em caso de erro
     */
    public String loadImageAsBase64(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                return null;
            }
            byte[] bytes = StreamUtils.copyToByteArray(resource.getInputStream());
            return Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            // Logar erro se necessário
            return null;
        }
    }
}
