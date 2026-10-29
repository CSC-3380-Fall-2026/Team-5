package com.timecapsule.profile.config;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
@RestControllerAdvice public class ApiErrorHandler {
 @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<Map<String,String>> invalid(MethodArgumentNotValidException ex){return ResponseEntity.badRequest().body(Map.of("error",ex.getBindingResult().getFieldErrors().stream().findFirst().map(e->e.getField()+": "+e.getDefaultMessage()).orElse("Invalid request")));}
 @ExceptionHandler(ResponseStatusException.class) ResponseEntity<Map<String,String>> status(ResponseStatusException ex){return ResponseEntity.status(ex.getStatusCode()).body(Map.of("error",ex.getReason()==null?"Request failed":ex.getReason()));}
}
