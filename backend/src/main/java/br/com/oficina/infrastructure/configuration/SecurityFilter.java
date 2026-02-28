package br.com.oficina.infrastructure.configuration;

import br.com.oficina.application.service.TokenService;
import br.com.oficina.domain.entities.User;
import br.com.oficina.infrastructure.persistence.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SecurityFilter extends OncePerRequestFilter {
	private final TokenService tokenService;
	private final UserRepository userRepository;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
		var token = this.recoverToken(request);

		if (token != null) {
			try {
				var userId = tokenService.validateToken(token);

				if (!userId.isEmpty()) {
					User user = userRepository.findById(UUID.fromString(userId)).orElseThrow(() -> new RuntimeException("User not found"));

					var authorities = user.getRoles().stream()
					                      .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
					                      .toList();

					var authentication = new UsernamePasswordAuthenticationToken(user, null ,authorities);
					SecurityContextHolder.getContext().setAuthentication(authentication);
				}
			} catch (RuntimeException ex) {
				response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
				response.setContentType("application/json");
				response.setCharacterEncoding("UTF-8");
				response.getWriter().write("{\"error\": \"Token inválido ou expirado. Faça login novamente.\"}");

				return;
			}


		}
		filterChain.doFilter(request, response);
	}

	private String recoverToken(HttpServletRequest request) {
		var authHeader = request.getHeader("Authorization");
		if (authHeader == null) return null;
		return authHeader.replace("Bearer ", "");
	}
}
