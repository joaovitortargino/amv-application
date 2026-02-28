package br.com.oficina.infrastructure.api.auth;

import br.com.oficina.application.dto.LoginRequestDTO;
import br.com.oficina.application.dto.LoginResponse;
import br.com.oficina.application.dto.RefreshTokenRequestDTO;
import br.com.oficina.application.dto.RegisterRequestDTO;
import br.com.oficina.application.service.AuthService;
import br.com.oficina.application.service.TokenService;
import br.com.oficina.domain.entities.User;
import br.com.oficina.infrastructure.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
	private final AuthService authService;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokenService;

	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login(@RequestBody LoginRequestDTO body) {
		User user = userRepository.findByEmail(body.email()).orElseThrow(() -> new RuntimeException("User not found"));
		if (passwordEncoder.matches(body.password(), user.getPassword())) {
			String token = tokenService.generateToken(user);
			String refreshToken = tokenService.generateRefreshToken(user);
			return ResponseEntity.ok(new LoginResponse(user.getName(), token, refreshToken));
		}
		return ResponseEntity.badRequest().build();
	}

	@PostMapping("/refresh")
	public ResponseEntity<LoginResponse> refreshToken(@RequestBody RefreshTokenRequestDTO body) {
		try {
			String userId = tokenService.validateToken(body.refreshToken());
			User user = userRepository.findById(UUID.fromString(userId)).orElseThrow(() -> new RuntimeException("User not found"));

			String newAccessToken = tokenService.generateToken(user);
			String newRefreshToken =  tokenService.generateRefreshToken(user);

			return ResponseEntity.ok(new LoginResponse(user.getName(), newAccessToken, newRefreshToken));
		} catch(RuntimeException e) {
			return ResponseEntity.status(401).build();
		}
	}

	@PostMapping("/register")
	public ResponseEntity<Object> register(@RequestBody RegisterRequestDTO dto) {
		authService.registerEnterpriseAndAdmin(dto);
		Map<String, String> response = Map.of("message", "Cadastrado com sucesso");
		return ResponseEntity.ok(response);
	}
}
