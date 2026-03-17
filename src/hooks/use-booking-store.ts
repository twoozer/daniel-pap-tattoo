'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SizeCategory, BookingType } from '@/types/booking';

interface BookingStore {
  // Step tracking
  currentStep: number;

  // Booking type
  bookingType: BookingType;

  // Flash design selection
  flashDesignId: string | null;
  flashDesignTitle: string | null;
  flashDesignStyle: string | null;
  flashDesignSuggestedSize: string | null;
  flashDesignImagePath: string | null;
  flashDesignDescription: string | null;

  // Size & price
  sizeCategory: SizeCategory | null;
  totalPrice: number | null;
  depositAmount: number | null;
  estimatedHours: number | null;

  // Tattoo details
  bodyPlacement: string;
  style: string;
  description: string;
  referenceImages: string[];

  // Schedule
  appointmentDate: string | null;
  appointmentStartTime: string | null;
  appointmentEndTime: string | null;

  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Consultation
  consultationNotes: string;

  // Actions
  setStep: (step: number) => void;
  setBookingType: (type: BookingType) => void;
  setFlashDesign: (design: {
    id: string;
    title: string;
    style?: string | null;
    suggestedSize?: string | null;
    imagePath?: string | null;
    description?: string | null;
  }) => void;
  setSize: (category: SizeCategory, price: number | null, deposit: number | null, hours: number | null) => void;
  setDetails: (details: { bodyPlacement: string; style: string; description: string }) => void;
  addReferenceImage: (path: string) => void;
  removeReferenceImage: (path: string) => void;
  setSchedule: (date: string, start: string, end: string) => void;
  setCustomerInfo: (info: { name: string; email: string; phone: string }) => void;
  setConsultationNotes: (notes: string) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  bookingType: 'standard' as BookingType,
  flashDesignId: null,
  flashDesignTitle: null,
  flashDesignStyle: null,
  flashDesignSuggestedSize: null,
  flashDesignImagePath: null,
  flashDesignDescription: null,
  sizeCategory: null,
  totalPrice: null,
  depositAmount: null,
  estimatedHours: null,
  bodyPlacement: '',
  style: '',
  description: '',
  referenceImages: [] as string[],
  appointmentDate: null,
  appointmentStartTime: null,
  appointmentEndTime: null,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  consultationNotes: '',
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setBookingType: (type) => set({ bookingType: type }),

      setFlashDesign: (design) =>
        set({
          flashDesignId: design.id,
          flashDesignTitle: design.title,
          flashDesignStyle: design.style || null,
          flashDesignSuggestedSize: design.suggestedSize || null,
          flashDesignImagePath: design.imagePath || null,
          flashDesignDescription: design.description || null,
          // Also pre-fill the style and description from the flash design
          ...(design.style ? { style: design.style } : {}),
          ...(design.description ? { description: `Flash design: ${design.title}. ${design.description}` } : { description: `Flash design: ${design.title}` }),
        }),

      setSize: (category, price, deposit, hours) =>
        set({
          sizeCategory: category,
          totalPrice: price,
          depositAmount: deposit,
          estimatedHours: hours,
        }),

      setDetails: (details) =>
        set({
          bodyPlacement: details.bodyPlacement,
          style: details.style,
          description: details.description,
        }),

      addReferenceImage: (path) =>
        set((state) => ({
          referenceImages: [...state.referenceImages, path],
        })),

      removeReferenceImage: (path) =>
        set((state) => ({
          referenceImages: state.referenceImages.filter((p) => p !== path),
        })),

      setSchedule: (date, start, end) =>
        set({
          appointmentDate: date,
          appointmentStartTime: start,
          appointmentEndTime: end,
        }),

      setCustomerInfo: (info) =>
        set({
          customerName: info.name,
          customerEmail: info.email,
          customerPhone: info.phone,
        }),

      setConsultationNotes: (notes) => set({ consultationNotes: notes }),

      reset: () => set(initialState),
    }),
    {
      name: 'booking-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
