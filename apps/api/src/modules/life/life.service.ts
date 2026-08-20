import { Injectable, NotFoundException } from '@nestjs/common';
import { CareerKind, FinanceKind, ProgressStatus, ReminderChannel } from '@prisma/client';
import { EncryptionService } from '../../core/encryption.service';
import { PrismaService } from '../../core/prisma.service';

@Injectable()
export class LifeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  listFinance(userId: string) {
    return this.prisma.financeItem.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  createFinance(userId: string, input: any) {
    return this.prisma.financeItem.create({
      data: {
        userId,
        kind: this.financeKind(input.kind),
        institution: input.institution,
        alias: input.alias,
        lastFour: input.lastFour,
        billingDay: input.billingDay,
        repaymentDay: input.repaymentDay,
        note: input.note,
      },
    });
  }

  async updateFinance(userId: string, id: string, input: any) {
    await this.assertOwned('financeItem', userId, id);
    return this.prisma.financeItem.update({
      where: { id },
      data: {
        ...input,
        kind: input.kind ? this.financeKind(input.kind) : undefined,
      },
    });
  }

  async deleteFinance(userId: string, id: string) {
    await this.assertOwned('financeItem', userId, id);
    await this.prisma.financeItem.delete({ where: { id } });
    return { deleted: true };
  }

  listCareer(userId: string) {
    return this.prisma.careerItem.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  createCareer(userId: string, input: any) {
    return this.prisma.careerItem.create({
      data: {
        userId,
        kind: this.careerKind(input.kind),
        title: input.title,
        status: this.progressStatus(input.status),
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        note: input.note,
      },
    });
  }

  async updateCareer(userId: string, id: string, input: any) {
    await this.assertOwned('careerItem', userId, id);
    return this.prisma.careerItem.update({
      where: { id },
      data: {
        ...input,
        kind: input.kind ? this.careerKind(input.kind) : undefined,
        status: input.status ? this.progressStatus(input.status) : undefined,
        targetDate: input.targetDate ? new Date(input.targetDate) : input.targetDate,
      },
    });
  }

  async deleteCareer(userId: string, id: string) {
    await this.assertOwned('careerItem', userId, id);
    await this.prisma.careerItem.delete({ where: { id } });
    return { deleted: true };
  }

  async listContacts(userId: string, search?: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { userId, name: search ? { contains: search, mode: 'insensitive' } : undefined },
      orderBy: { name: 'asc' },
    });
    return contacts.map(({ encryptedPhone, ...contact }) => ({
      ...contact,
      phone: encryptedPhone ? this.encryption.decrypt(encryptedPhone) : null,
    }));
  }

  async createContact(userId: string, input: any) {
    const contact = await this.prisma.contact.create({
      data: {
        userId,
        name: input.name,
        className: input.className,
        encryptedPhone: input.phone ? this.encryption.encrypt(input.phone) : null,
        birthday: input.birthday,
        photoKey: input.photoKey,
        note: input.note,
      },
    });
    const { encryptedPhone: _encryptedPhone, ...safe } = contact;
    return { ...safe, phone: input.phone ?? null };
  }

  async updateContact(userId: string, id: string, input: any) {
    await this.assertOwned('contact', userId, id);
    const contact = await this.prisma.contact.update({
      where: { id },
      data: {
        name: input.name,
        className: input.className,
        encryptedPhone:
          input.phone === undefined
            ? undefined
            : input.phone
              ? this.encryption.encrypt(input.phone)
              : null,
        birthday: input.birthday,
        photoKey: input.photoKey,
        note: input.note,
      },
    });
    const { encryptedPhone: _encryptedPhone, ...safe } = contact;
    return { ...safe, phone: input.phone ?? null };
  }

  async deleteContact(userId: string, id: string) {
    await this.assertOwned('contact', userId, id);
    await this.prisma.contact.delete({ where: { id } });
    return { deleted: true };
  }

  listReminders(userId: string) {
    return this.prisma.reminder.findMany({ where: { userId }, orderBy: { remindAt: 'asc' } });
  }

  createReminder(userId: string, input: any) {
    return this.prisma.reminder.create({
      data: {
        userId,
        title: input.title,
        remindAt: new Date(input.remindAt),
        channel: input.channel === 'wechat' ? ReminderChannel.WECHAT : ReminderChannel.IN_APP,
      },
    });
  }

  async deleteReminder(userId: string, id: string) {
    await this.assertOwned('reminder', userId, id);
    await this.prisma.reminder.update({ where: { id }, data: { status: 'CANCELLED' } });
    return { deleted: true };
  }

  private async assertOwned(
    model: 'financeItem' | 'careerItem' | 'contact' | 'reminder',
    userId: string,
    id: string,
  ) {
    const item = await (this.prisma[model] as any).findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException('记录不存在');
  }

  private financeKind(kind: string) {
    const values: Record<string, FinanceKind> = {
      'bank-card': FinanceKind.BANK_CARD,
      'payment-account': FinanceKind.PAYMENT_ACCOUNT,
      loan: FinanceKind.LOAN,
      credit: FinanceKind.CREDIT,
    };
    return values[kind] ?? FinanceKind.BANK_CARD;
  }

  private careerKind(kind: string) {
    const values: Record<string, CareerKind> = {
      goal: CareerKind.GOAL,
      resume: CareerKind.RESUME,
      'side-project': CareerKind.SIDE_PROJECT,
    };
    return values[kind] ?? CareerKind.GOAL;
  }

  private progressStatus(status?: string) {
    const values: Record<string, ProgressStatus> = {
      planned: ProgressStatus.PLANNED,
      active: ProgressStatus.ACTIVE,
      paused: ProgressStatus.PAUSED,
      completed: ProgressStatus.COMPLETED,
    };
    return values[status ?? 'planned'] ?? ProgressStatus.PLANNED;
  }
}
