package br.com.oficina.application.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;

@Service
public class BarcodeService {

    public String generateItfBase64(String value) {
        String numericValue = onlyDigits(value);
        if (numericValue == null || numericValue.isBlank()) {
            return null;
        }

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            BitMatrix matrix = new MultiFormatWriter().encode(
                    numericValue,
                    BarcodeFormat.ITF,
                    820,
                    90,
                    Map.of(EncodeHintType.MARGIN, 0)
            );
            MatrixToImageWriter.writeToStream(matrix, "PNG", outputStream);
            return Base64.getEncoder().encodeToString(outputStream.toByteArray());
        } catch (Exception e) {
            return null;
        }
    }

    private String onlyDigits(String value) {
        return value == null ? null : value.replaceAll("\\D", "");
    }
}
