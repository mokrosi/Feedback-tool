package com.training.feedbacktool.controller;

import com.training.feedbacktool.common.ApiResponse;
import com.training.feedbacktool.common.ResponseUtils;
import com.training.feedbacktool.entity.Answer;
import com.training.feedbacktool.repository.AnswersRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/answers") // Base URL for this controller
@CrossOrigin(origins = "*")
public class AnswersController {

    private final AnswersRepository repository;

    // Constructor injection
    public AnswersController(AnswersRepository repository) {
        this.repository = repository;
    }

    // GET /api/answers → Get all answers
    @GetMapping
    public ResponseEntity<ApiResponse<List<Answer>>> getAllAnswers() {
        return ResponseUtils.handleListResult(repository.findAll(), "answers");
    }

    // POST /api/answers → Create a new answer
    @PostMapping
    public ResponseEntity<ApiResponse<Answer>> createAnswer(@RequestBody Answer answer) {
        return ResponseUtils.handleServiceCall(
                () -> repository.save(answer),
                "Answer created successfully",
                HttpStatus.CREATED);
    }
}
