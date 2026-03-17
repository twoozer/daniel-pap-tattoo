import { z } from 'zod';

export const customerInfoSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  customer_email: z.string().email('Please enter a valid email'),
  customer_phone: z.string().min(6, 'Please enter a valid phone number'),
});

export const tattooDetailsSchema = z.object({
  body_placement: z.string().min(1, 'Please select a placement'),
  style: z.string().min(1, 'Please select a style'),
  description: z.string().optional(),
});

export const consultationSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  customer_email: z.string().email('Please enter a valid email'),
  customer_phone: z.string().min(6, 'Please enter a valid phone number'),
  consultation_notes: z.string().optional(),
});

export const createBookingSchema = z.object({
  booking_type: z.enum(['standard', 'consultation', 'custom_quote']),
  customer_name: z.string().min(2),
  customer_email: z.string().email(),
  customer_phone: z.string().min(6, 'Please enter a valid phone number'),
  size_category: z.enum(['tiny', 'small', 'medium', 'large', 'custom']).optional(),
  body_placement: z.string().optional(),
  style: z.string().optional(),
  description: z.string().optional(),
  flash_design_id: z.string().uuid().optional(),
  reference_images: z.array(z.string()).optional(),
  appointment_date: z.string().optional(),
  appointment_start_time: z.string().optional(),
  appointment_end_time: z.string().optional(),
  consultation_notes: z.string().optional(),
});

export type CustomerInfoData = z.infer<typeof customerInfoSchema>;
export type TattooDetailsData = z.infer<typeof tattooDetailsSchema>;
export type ConsultationData = z.infer<typeof consultationSchema>;
export type CreateBookingData = z.infer<typeof createBookingSchema>;
