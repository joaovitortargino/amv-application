package br.com.oficina.application.service;

import br.com.oficina.domain.entities.User;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class TokenService {

	@Value("${api.security.secret-key}")
	private String secretKey;
	private SecretKey key;

	@PostConstruct
	public void init() {
		this.key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
	}

	public String generateToken(User user) {
		try {
			Instant expirationTime = Instant.now().plus(30, ChronoUnit.MINUTES);

			return Jwts.builder()
			           .subject(user.getId().toString())
			           .claim("email", user.getEmail())
			           .claim("enterpriseId", user.getEnterpriseId().toString())
			           .expiration(Date.from(expirationTime))
			           .signWith(key)
			           .compact();
		} catch(Exception e) {
			throw new RuntimeException("Erro ao gerar Access Token", e);
		}
	}

	public String generateRefreshToken(User user) {
		try {
			Instant expirationTime = Instant.now().plus(7, ChronoUnit.DAYS);

			return Jwts.builder()
			           .subject(user.getId().toString())
			           .expiration(Date.from(expirationTime))
			           .signWith(key)
			           .compact();
		} catch(Exception e) {
			throw new RuntimeException("Erro ao gerar Refresh Token", e);
		}
	}

	public String validateToken(String token) {
		try {
			SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

			return Jwts.parser()
					.verifyWith(key)
					.build()
					.parseSignedClaims(token)
					.getPayload()
					.getSubject();

		} catch(Exception e) {
			throw new RuntimeException("Error with validate JWT token",e);
		}
	}
}
