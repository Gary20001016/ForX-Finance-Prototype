import { beforeEach, describe, expect, it } from 'vitest';
import {
  approveTranslation,
  createTranslationBatch,
  getPrototypeState,
  markMessageRead,
  resetPrototypeStore,
  submitTask,
  reviewApproval,
  saveTaskDraft,
  submitTemplateForApproval,
} from './prototypeStore';

describe('prototype store workflow transitions', () => {
  beforeEach(() => resetPrototypeStore());

  it('persists a single message read transition', () => {
    markMessageRead('UM-1001');
    expect(getPrototypeState().messages.find((item) => item.id === 'UM-1001')?.read).toBe(true);
  });

  it('creates an external translation batch and opens human review', () => {
    const batch = createTranslationBatch({
      templateId:'TPL-1001',
      targetLocales:['fr-FR'],
      createdBy:'Gary Ma',
    });
    expect(batch.items[0].externalTaskId).toMatch(/^EXT-MT-/);
    expect(batch.items[0].status).toBe('待人工审核');
  });

  it('opens the publishing gate after every locale is approved', () => {
    const batch = createTranslationBatch({ templateId:'TPL-1001', targetLocales:['fr-FR'], createdBy:'Gary Ma' });
    approveTranslation(batch.items[0].id, {
      title:'Retrait réussi', summary:'Le retrait est arrivé.', body:'Votre retrait est arrivé.', reviewer:'Gary Ma',
    });
    expect(getPrototypeState().translationBatches.find((item) => item.id === batch.id)?.status).toBe('全部审核通过');
  });

  it('submits a task and creates a linked approval object', () => {
    const task = submitTask({
      name:'临时风险消息', category:'风控通知', nature:'事务', risk:'关键', contentMode:'temporary',
      template:'临时消息 v1', channels:['站内信','Push'], audience:'全部有效用户', audienceCount:120,
      schedule:'立即', creator:'Gary Ma', team:'风险控制', content:{ sourceLocale:'zh-CN', locales:['zh-CN'], web:{ title:'风险提示', summary:'请立即处理', body:'账户存在风险。' }, push:{ title:'风险提示', body:'请立即处理', deepLink:'forxfinance://security/devices', priority:'高', platform:'全部设备' } },
    });
    const approval = getPrototypeState().approvals.find((item) => item.taskId === task.id);
    expect(task.status).toBe('待审核');
    expect(approval?.name).toBe('临时风险消息');
  });

  it('records an approval decision and updates the linked task', () => {
    reviewApproval('APR-8812', { decision:'approve', reviewer:'Gary Ma', opinion:'内容已核对' });
    expect(getPrototypeState().approvals.find((item) => item.id === 'APR-8812')?.status).toBe('已通过');
    expect(getPrototypeState().tasks.find((item) => item.name === '夏季交易赛召回')?.status).toBe('待发送');
  });

  it('publishes a template only after business approval', () => {
    const approval=submitTemplateForApproval('TPL-1001');
    expect(getPrototypeState().templates.find((item)=>item.id==='TPL-1001')?.status).toBe('待业务审核');
    reviewApproval(approval.id,{decision:'approve',reviewer:'Reviewer 02',opinion:'内容与变量已核对'});
    expect(getPrototypeState().templates.find((item)=>item.id==='TPL-1001')?.status).toBe('已发布');
  });

  it('withdraws the old approval when an existing task is edited back to draft', () => {
    const current=getPrototypeState().tasks.find((item)=>item.name==='夏季交易赛召回')!;
    saveTaskDraft({
      name:current.name,category:current.category,nature:current.nature,risk:current.risk,
      template:current.template,channels:current.channels,audience:current.audience,
      audienceCount:current.audienceCount,schedule:current.schedule,creator:current.creator,
      team:current.team,contentMode:current.contentMode,content:current.content,
    },current.id);
    expect(getPrototypeState().tasks.find((item)=>item.id===current.id)?.status).toBe('草稿');
    expect(getPrototypeState().approvals.find((item)=>item.id==='APR-8812')?.status).toBe('已撤回');
  });
});
