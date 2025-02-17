import { Comment, ParameterType, ReflectionCategory, SignatureReflection } from 'typedoc';
import { MarkdownApplication } from 'typedoc-plugin-markdown';
import * as fs from 'fs';
import * as path from 'path';
import { getBlockTagIndex } from './utils';

function createMemberPartialFunction(fn) {
    return (model: SignatureReflection, options) => {
        const content: string = fn(model, options);
        const tsCodeIndex = content.indexOf('```ts');
        if (tsCodeIndex < 0) {
            return '<details>\n' + content + '\n</details>\n';
        }
        const codeEndIndex = content.indexOf('```', tsCodeIndex + 6) + 4;
        return content.substring(0, codeEndIndex) + '<details>\n' + content.substring(codeEndIndex) + '\n\n</details>\n';
    };
}

function createCommentFunction(fn, lang: string) {
    return (model: Comment, options) => {
        const index = getBlockTagIndex(model, '@' + lang);
        if (index >= 0) {
            // 去掉  lang blockTag
            const langBlock = model.blockTags.splice(index, 1);

            model.summary = langBlock[0].content;

        }
        const content: string = fn(model, options);
        return content;
    };
}


function createSidebarIndex(fn, outFolder: string) {
    return (models: ReflectionCategory[], options) => {
        const content: string = fn(models, options);
        const categories = models.map(model => {
            let title = model.title;
            title = title[0].toUpperCase() + title.substring(1);
            const info = { text: title, collapsed: false, items: model.children.map(c => { return { 'text': c.getFullName(), 'link': 'classes/' + c.getFullName() }; }) };
            return info;
        });
        fs.writeFileSync(path.join(outFolder, 'sidebarApi.json'), JSON.stringify(categories, null, 2));
        return content;
    };
}

export function load(app: MarkdownApplication) {
    app.options.addDeclaration({
        help: '[MapTalks Plugin] Comment language',
        name: 'lang',
        type: ParameterType.String,
        defaultValue: "chinese",
    });

    const outFolder = app.options.getValue('out');


    app.renderer.markdownHooks.on(
        'page.begin',
        event => {
            const lang = app.options.getValue('lang') as string;
            console.log('lang', lang);
            event.partials.signature = createMemberPartialFunction(event.partials.signature);
            event.partials.comment = createCommentFunction(event.partials.comment, lang);
            return '';
        }
    );

    app.renderer.markdownHooks.on(
        'index.page.begin',
        event => {
            event.partials.categories = createSidebarIndex(event.partials.categories, outFolder);
            return '';
        }
    );
}
