"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitAnswersDto = exports.AnswerItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const option_enum_1 = require("../../common/enums/option.enum");
class AnswerItemDto {
}
exports.AnswerItemDto = AnswerItemDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AnswerItemDto.prototype, "questionId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(option_enum_1.CorrectOption),
    __metadata("design:type", String)
], AnswerItemDto.prototype, "selectedOption", void 0);
class SubmitAnswersDto {
}
exports.SubmitAnswersDto = SubmitAnswersDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AnswerItemDto),
    __metadata("design:type", Array)
], SubmitAnswersDto.prototype, "answers", void 0);
//# sourceMappingURL=submit-answers.dto.js.map