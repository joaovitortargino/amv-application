package br.com.oficina.domain.vo;

public record Vehicle(
		String mark,
		String model,
		Integer year,
		String plate
) {
	public Vehicle {
		if (plate == null || plate.isBlank()) {
			throw new IllegalArgumentException("Vehicle plate is required");
		}
	}
}
