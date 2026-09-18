import { z } from 'zod';

/* ---------------- Shared primitives ---------------- */

export const uuid = z.string().uuid('معرف غير صالح');

export const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .max(72, 'كلمة المرور طويلة جدًا')
  .regex(/[A-Za-z]/, 'كلمة المرور يجب أن تحتوي على حرف واحد على الأقل')
  .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('بريد إلكتروني غير صالح')
  .max(254, 'البريد الإلكتروني طويل جدًا');

/* ---------------- Auth ---------------- */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة')
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registrationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
      .max(60, 'الاسم طويل جدًا'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
    governorateId: uuid,
    areaId: uuid,
    schoolId: z.union([uuid, z.literal('')]).optional(),
    bio: z.string().trim().max(300, 'النوع الشخصي طويل جدًا').optional().or(z.literal(''))
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword']
  });
export type RegistrationInput = z.infer<typeof registrationSchema>;

/* ---------------- Profile ---------------- */

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(60, 'الاسم طويل جدًا'),
  bio: z.string().trim().max(300, 'النبذة طويلة جدًا').optional().or(z.literal('')),
  avatarUrl: z
    .string()
    .url('رابط الصورة غير صالح')
    .refine((v) => v.startsWith('/files/') || /^https?:\/\//.test(v), 'رابط الصورة غير صالح')
    .optional()
    .or(z.literal('')),
  governorateId: z.union([uuid, z.literal('')]).optional(),
  areaId: z.union([uuid, z.literal('')]).optional(),
  schoolId: z.union([uuid, z.literal('')]).optional()
});
export type ProfileInput = z.infer<typeof profileSchema>;

/* ---------------- Listings ---------------- */

export const listingTypeSchema = z.enum(['sale', 'exchange', 'free']);
export const conditionSchema = z.enum(['new', 'like-new', 'good', 'used', 'damaged']);

const priceSchema = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim());

export const imageUrlsSchema = z
  .array(
    z
      .string()
      .refine(
        (v) => v.startsWith('/files/') || /^https?:\/\/.+/i.test(v),
        'رابط الصورة غير صالح'
      )
  )
  .max(6, 'لا يمكن إضافة أكثر من 6 صور');

export const listingSchema = z
  .object({
    type: listingTypeSchema,
    title: z
      .string()
      .trim()
      .min(4, 'العنوان قصير جدًا')
      .max(100, 'العنوان طويل جدًا'),
    description: z
      .string()
      .trim()
      .min(10, 'الوصف قصير جدًا')
      .max(2000, 'الوصف طويل جدًا'),
    price: priceSchema.optional(),
    categoryId: uuid,
    governorateId: uuid,
    areaId: uuid,
    schoolId: z.union([uuid, z.literal('')]).optional(),
    condition: conditionSchema,
    imageUrls: imageUrlsSchema
  })
  .superRefine((data, ctx) => {
    const price = data.price;
    const num = price === undefined ? null : Number(price);
    if (data.type === 'free') {
      // free items must not have a price
      if (price !== undefined && price !== '' && (num === null || Number.isNaN(num) || num !== 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price'],
          message: 'الإعلانات المجانية لا تحتاج سعرًا'
        });
      }
    } else if (data.type === 'sale') {
      if (num === null || Number.isNaN(num) || num <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price'],
          message: 'السعر يجب أن يكون رقمًا أكبر من صفر'
        });
      }
      if (num !== null && num > 10_000_000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price'],
          message: 'السعر غير منطقي'
        });
      }
    } else if (data.type === 'exchange') {
      if (price !== undefined && price !== '' && (num === null || Number.isNaN(num) || num < 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price'],
          message: 'قيمة التبادل يجب أن تكون رقمًا صحيحًا'
        });
      }
    }
  });
export type ListingInput = z.infer<typeof listingSchema>;

/* ---------------- Wanted items ---------------- */

export const wantedStatusSchema = z.enum(['open', 'found', 'closed']);

export const wantedSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'العنوان قصير جدًا')
    .max(120, 'العنوان طويل جدًا'),
  description: z
    .string()
    .trim()
    .min(10, 'الوصف قصير جدًا')
    .max(1000, 'الوصف طويل جدًا'),
  categoryId: uuid,
  governorateId: uuid,
  areaId: uuid,
  schoolId: z.union([uuid, z.literal('')]).optional(),
  status: wantedStatusSchema.optional()
});
export type WantedInput = z.infer<typeof wantedSchema>;

/* ---------------- Messages ---------------- */

export const messageSchema = z.object({
  conversationId: uuid,
  body: z
    .string()
    .trim()
    .min(1, 'الرسالة فارغة')
    .max(1000, 'الرسالة طويلة جدًا')
});
export type MessageInput = z.infer<typeof messageSchema>;

export const startConversationSchema = z.object({
  withUserId: uuid
});

/* ---------------- Reports ---------------- */

export const reportReasons = [
  'محتوى مخالف',
  'احتيال',
  'إعلان مزيف',
  'إساءة',
  'محتوى غير مناسب',
  'أخرى'
] as const;

export const reportSchema = z.object({
  targetType: z.enum(['listing', 'user', 'message']),
  targetId: uuid,
  reason: z.enum(reportReasons, {
    errorMap: () => ({ message: 'سبب البلاغ غير صالح' })
  }),
  details: z.string().trim().max(500, 'التفاصيل طويلة جدًا').optional().or(z.literal(''))
});
export type ReportInput = z.infer<typeof reportSchema>;

/* ---------------- Search / filters ---------------- */

export const listingFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  type: z.enum(['sale', 'exchange', 'free']).optional(),
  categoryId: uuid.optional(),
  governorateId: uuid.optional(),
  areaId: uuid.optional(),
  schoolId: uuid.optional(),
  condition: conditionSchema.optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc']).optional(),
  page: z.coerce.number().int().min(1).optional()
});
export type ListingFilters = z.infer<typeof listingFiltersSchema>;

/* ---------------- Admin ---------------- */

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'اسم التصنيف قصير جدًا').max(40, 'اسم التصنيف طويل جدًا'),
  icon: z.string().max(8, 'الأيقونة طويلة جدًا').optional().or(z.literal('')),
  isActive: z.boolean()
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const governorateSchema = z.object({
  name: z.string().trim().min(2, 'اسم المحافظة قصير جدًا').max(40, 'اسم المحافظة طويل جدًا')
});
export type GovernorateInput = z.infer<typeof governorateSchema>;

export const areaSchema = z.object({
  name: z.string().trim().min(2, 'اسم المركز قصير جدًا').max(60, 'اسم المركز طويل جدًا'),
  governorateId: uuid
});
export type AreaInput = z.infer<typeof areaSchema>;

export const schoolSchema = z.object({
  name: z.string().trim().min(2, 'اسم المدرسة قصير جدًا').max(80, 'اسم المدرسة طويل جدًا'),
  areaId: uuid,
  isActive: z.boolean()
});
export type SchoolInput = z.infer<typeof schoolSchema>;

export const listingStatusSchema = z.enum([
  'active',
  'sold',
  'exchanged',
  'closed',
  'pending',
  'removed'
]);

export const userStatusSchema = z.enum(['active', 'suspended']);

export const reportStatusSchema = z.enum(['open', 'resolved', 'dismissed']);
