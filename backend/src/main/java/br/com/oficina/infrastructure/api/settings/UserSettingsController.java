package br.com.oficina.infrastructure.api.settings;

import br.com.oficina.application.service.UserService;
import br.com.oficina.domain.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings/user")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<UserResponse> getProfile() {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(new UserResponse(user.getId().toString(), user.getName(), user.getEmail()));
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(@RequestBody UpdateProfileDTO dto) {
        User user = userService.updateProfile(dto.name(), dto.password());
        return ResponseEntity.ok(new UserResponse(user.getId().toString(), user.getName(), user.getEmail()));
    }

    public record UserResponse(String id, String name, String email) {}
    public record UpdateProfileDTO(String name, String password) {}
}
