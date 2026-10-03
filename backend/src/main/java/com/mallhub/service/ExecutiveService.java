package com.mallhub.service;

import com.mallhub.dto.MallDtos;
import com.mallhub.dto.PeopleDtos;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.ExecutiveRepository;
import com.mallhub.repository.MallRepository;
import com.mallhub.repository.OverseesRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExecutiveService {
    private final ExecutiveRepository executives;
    private final OverseesRepository oversees;
    private final MallService malls;
    private final MallRepository mallRepository;

    public ExecutiveService(ExecutiveRepository executives, OverseesRepository oversees,
                            MallService malls, MallRepository mallRepository) {
        this.executives = executives;
        this.oversees = oversees;
        this.malls = malls;
        this.mallRepository = mallRepository;
    }

    public PeopleDtos.ExecutiveResponse get(Integer id) {
        var e = executives.findById(id).orElseThrow(() -> ApiException.notFound("Executive"));
        List<Integer> mallIds = oversees.findByIdExecutiveId(id).stream()
                .map(o -> o.getId().getMallId()).toList();
        return new PeopleDtos.ExecutiveResponse(e.getExecutiveId(), e.getFirstName(),
                e.getLastName(), e.getEmail(), e.getDateJoined(), e.getPhoneNumber(), mallIds);
    }

    public List<MallDtos.MallResponse> mallsByExecutive(Integer id) {
        if (!executives.existsById(id)) throw ApiException.notFound("Executive");
        return oversees.findByIdExecutiveId(id).stream()
                .map(o -> mallRepository.findById(o.getId().getMallId()).orElse(null))
                .filter(m -> m != null)
                .map(malls::toResponse).toList();
    }
}
