import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class LaTeXService {
    private readonly templatesDir = join(process.cwd(), 'templates');

    async getTemplateContent(templatePath: string): Promise<string> {
        const mainTexPath = join(this.templatesDir, templatePath, 'main.tex');
        return fs.readFile(mainTexPath, 'utf-8');
    }

    async compileTemplate(templatePath: string, data: any): Promise<string> {
        const template = await this.getTemplateContent(templatePath);
        // TODO: Implement template compilation with user data
        return template;
    }

    getTemplatePath(templatePath: string): string {
        return join(this.templatesDir, templatePath);
    }
} 