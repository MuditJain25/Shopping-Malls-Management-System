package com.mallhub.dto;

import java.util.List;

// Returned only when ?page= is present; otherwise controllers return plain arrays.
public record PageEnvelope<T>(List<T> content, int page, int size,
                              long totalElements, int totalPages, boolean last) {
}
