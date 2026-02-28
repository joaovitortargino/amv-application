package br.com.oficina.infrastructure.configuration;

import br.com.oficina.shared.exceptions.BusinessException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<Object> handleBusiness(BusinessException ex) {
		return ResponseEntity.badRequest().body(Map.of(
				"error", "Business Rule Error",
				"message", ex.getMessage(),
				"timestamp", LocalDateTime.now()
		));
	}
}