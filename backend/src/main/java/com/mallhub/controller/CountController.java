package com.mallhub.controller;

import com.mallhub.exception.ApiException;
import com.mallhub.security.Access;
import com.mallhub.service.CountService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/counts")
public class CountController {
    private final CountService counts;
    private final Access access;

    public CountController(CountService counts, Access access) {
        this.counts = counts;
        this.access = access;
    }

    /** Executive: overall, ?mallId=, or ?groupBy=mall. Manager: own mall only. ?include= picks the counts. */
    @GetMapping
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE') and (hasRole('EXECUTIVE') or #groupBy == null)")
    public Object counts(@RequestParam(required = false) Integer mallId,
                         @RequestParam(required = false) String include,
                         @RequestParam(required = false) String groupBy) {
        if (groupBy == null) return counts.count(access.scopeMall(mallId), include);
        if (mallId != null) throw ApiException.badRequest("groupBy cannot be combined with mallId");
        return counts.countByMall(groupBy, include);
    }
}
