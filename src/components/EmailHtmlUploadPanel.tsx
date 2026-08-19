import { useState } from "react";
import { Alert, Button, Modal, Space, Tag } from "@arco-design/web-react";
import { createEmailHtmlAsset } from "../domain/emailChannel";
import type { EmailHtmlAsset, EmailType } from "../domain/types";

export default function EmailHtmlUploadPanel({
  locales,
  sourceLocale,
  assets,
  emailType,
  declaredVariables,
  onChange,
}: {
  locales: string[];
  sourceLocale: string;
  assets: Record<string, EmailHtmlAsset>;
  emailType: EmailType;
  declaredVariables: string[];
  onChange: (assets: Record<string, EmailHtmlAsset>) => void;
}) {
  const [previewAsset, setPreviewAsset] = useState<EmailHtmlAsset>();
  const enabledLocales = [...new Set([sourceLocale, ...locales])];

  const upload = async (locale: string, file?: File) => {
    if (!file) return;
    const html = await file.text();
    const asset = createEmailHtmlAsset({
      locale,
      fileName: file.name,
      fileSize: file.size,
      html,
      emailType,
      declaredVariables,
      uploadedBy: "当前操作者",
    });
    onChange({ ...assets, [locale]: asset });
  };

  const remove = (locale: string) => {
    const next = { ...assets };
    delete next[locale];
    onChange(next);
  };

  return (
    <div className="email-html-upload-panel">
      <Alert
        type="info"
        showIcon
        title="按语言上传 HTML 完成稿"
        content="HTML 正文不进入外部机翻或多语言审核；标题和预览文字仍走外部机翻。HTML 上传后进行安全、变量和普通内容审核。"
      />
      <div className="email-html-locale-grid">
        {enabledLocales.map((locale) => {
          const asset = assets[locale];
          const blocked = asset?.validationStatus === "blocked";
          return (
            <section className="email-html-locale-card" key={locale} aria-label={`${locale} HTML 上传`}>
              <div className="email-html-card-heading">
                <strong>{locale} HTML</strong>
                <Space size="mini">
                  {locale === sourceLocale && <Tag color="arcoblue">源语言</Tag>}
                  {asset && (
                    <Tag color={blocked ? "red" : "green"}>
                      {blocked ? "校验阻断" : "校验通过"}
                    </Tag>
                  )}
                  {asset && !blocked && <Tag color="orange">待内容审核</Tag>}
                </Space>
              </div>
              {asset ? (
                <>
                  <div className="email-html-file-meta">
                    <span>{asset.fileName}</span>
                    <small>{Math.max(1, Math.ceil(asset.fileSize / 1024))} KB · {asset.uploadedAt}</small>
                  </div>
                  {asset.validationIssues.length > 0 && (
                    <ul className="email-html-issues">
                      {asset.validationIssues.map((issue) => (
                        <li key={`${issue.level}-${issue.message}`} className={issue.level === "阻断" ? "blocked" : "warning"}>
                          {issue.level}：{issue.message}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Space size="small">
                    <Button size="mini" disabled={blocked} onClick={() => setPreviewAsset(asset)}>
                      预览
                    </Button>
                    <label className="email-html-upload-button">
                      替换
                      <input
                        aria-label={`替换 ${locale} HTML`}
                        type="file"
                        accept=".html,.htm,text/html"
                        onChange={(event) => void upload(locale, event.target.files?.[0])}
                      />
                    </label>
                    <Button size="mini" status="danger" onClick={() => remove(locale)}>
                      删除
                    </Button>
                  </Space>
                </>
              ) : (
                <div className="email-html-empty">
                  <span>尚未上传该语言版本</span>
                  <label className="email-html-upload-button primary">
                    上传 HTML 文件
                    <input
                      aria-label={`上传 ${locale} HTML`}
                      type="file"
                      accept=".html,.htm,text/html"
                      onChange={(event) => void upload(locale, event.target.files?.[0])}
                    />
                  </label>
                </div>
              )}
            </section>
          );
        })}
      </div>
      <Modal
        visible={Boolean(previewAsset)}
        title={`${previewAsset?.locale || ""} HTML 预览`}
        footer={null}
        style={{ width: 760 }}
        onCancel={() => setPreviewAsset(undefined)}
      >
        {previewAsset && (
          <iframe
            className="email-html-preview-iframe"
            title={`${previewAsset.locale} HTML 预览`}
            sandbox=""
            srcDoc={previewAsset.sanitizedHtml}
          />
        )}
      </Modal>
    </div>
  );
}

