import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Gem, ShieldCheck, Star, Wine } from 'lucide-react'
import Header from '../components/header'
import { ApiError, api } from '../lib/api'
import {
  eventOptions,
  getReservationDateError,
  normalizePhone,
  peopleOptions,
  tableOptions,
  timeOptions,
  toDateInputValue,
} from '../lib/reservationOptions'

type FormData = {
  evento: string
  fecha: string
  personas: string
  hora: string
  tipoMesa: string
  nombre: string
  telefono: string
  comentarios: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

const neonButton =
  'border border-pink-500 rounded-md uppercase font-black text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.8)] transition-all duration-300 hover:scale-[1.02] hover:bg-pink-500/10 hover:text-white hover:shadow-[0_0_28px_rgba(236,72,153,1)] active:scale-[0.98]'

const minReservationDate = toDateInputValue()
const alertDurationMs = 4000

function scrollToFirstError() {
  window.setTimeout(() => {
    document
      .querySelector('[data-error="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 50)
}

function Reservacion() {
  const initialParams = new URLSearchParams(window.location.search)
  const [formData, setFormData] = useState<FormData>({
    evento: initialParams.get('evento') || '',
    fecha: initialParams.get('fecha') || '',
    personas: initialParams.get('personas') || '',
    hora: initialParams.get('hora') || '',
    tipoMesa: initialParams.get('tipoMesa') || '',
    nombre: '',
    telefono: '',
    comentarios: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!successMessage && !submitError) return

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage('')
      setSubmitError('')
    }, alertDurationMs)

    return () => window.clearTimeout(timeoutId)
  }, [successMessage, submitError])

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name } = event.target
    const value =
      name === 'telefono' ? normalizePhone(event.target.value) : event.target.value

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: name === 'fecha' && value ? getReservationDateError(value) : '',
    }))

    setSuccessMessage('')
    setSubmitError('')
  }

  function validateForm() {
    const newErrors: FormErrors = {}

    if (
      !formData.evento ||
      !eventOptions.some((option) => option.value === formData.evento)
    ) {
      newErrors.evento = 'Selecciona el evento al que quieres asistir.'
    }

    const dateError = getReservationDateError(formData.fecha)
    if (dateError) newErrors.fecha = dateError

    if (!formData.personas || !peopleOptions.includes(formData.personas)) {
      newErrors.personas = 'Selecciona cuántas personas asistirán.'
    }

    if (
      !formData.hora ||
      !timeOptions.some((option) => option.value === formData.hora)
    ) {
      newErrors.hora = 'Selecciona una hora.'
    }

    if (
      !formData.tipoMesa ||
      !tableOptions.some((option) => option.value === formData.tipoMesa)
    ) {
      newErrors.tipoMesa = 'Selecciona un tipo de mesa.'
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'Escribe tu nombre.'
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres.'
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'Escribe tu telefono.'
    } else if (formData.telefono.length !== 10) {
      newErrors.telefono = 'El telefono debe tener exactamente 10 digitos.'
    }

    return newErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateForm()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setSuccessMessage('')
      setSubmitError('')
      scrollToFirstError()
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await api.createPublicReservation({
        customerName: formData.nombre,
        customerPhone: formData.telefono,
        eventName: formData.evento,
        reservationDate: formData.fecha,
        reservationTime: formData.hora,
        tableType: formData.tipoMesa,
        peopleCount: Number(formData.personas),
        reservationCount: 1,
        notes: formData.comentarios,
      })

      setFormData({
        evento: '',
        fecha: '',
        personas: '',
        hora: '',
        tipoMesa: '',
        nombre: '',
        telefono: '',
        comentarios: '',
      })
      setSuccessMessage(
        'Reserva enviada correctamente. Pronto nos pondremos en contacto contigo para confirmar ubicacion y detalles.'
      )
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        setErrors({
          nombre: error.details.customerName,
          telefono: error.details.customerPhone,
          evento: error.details.eventName,
          fecha: error.details.reservationDate,
          hora: error.details.reservationTime,
          personas: error.details.peopleCount,
          tipoMesa: error.details.tableType,
        })
        scrollToFirstError()
      }
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar la reservacion.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />

      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/ESCENARIO2.png')" }}
        />

        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.76)_36%,rgba(0,0,0,0.30)_100%)]" />

        <div className="laser laser-pink top-[18%] left-[48%] w-[48%] rotate-[14deg]" />
        <div className="laser laser-blue top-[28%] right-[-10%] w-[38%] rotate-[-20deg]" />
        <div className="laser laser-pink top-[10%] right-[6%] w-[28%] rotate-[-62deg]" />
        <div className="laser laser-blue bottom-[18%] right-[8%] w-[24%] rotate-[-48deg]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(236,72,153,0.22),transparent_18%),radial-gradient(circle_at_82%_30%,rgba(59,130,246,0.14),transparent_18%)]" />

        <div className="relative mx-auto grid min-h-[300px] max-w-[1600px] grid-cols-1 items-center gap-7 px-6 py-10 md:min-h-[320px] md:px-12 md:py-12 xl:grid-cols-[1.25fr_0.75fr] xl:px-20">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.32em] text-white/80 md:text-base md:tracking-[0.45em]">
              Tu noche empieza aquí
            </p>

            <h1 className="reservation-neon-title font-['Bebas_Neue'] text-5xl uppercase leading-none sm:text-6xl md:text-8xl xl:text-9xl">
              Reservaciones
            </h1>

            <p className="mt-3 max-w-2xl text-lg text-white/85 md:text-2xl">
              Elige tu evento, fecha y asegura tu mesa.
            </p>
          </div>

          <div className="flex justify-center xl:justify-end">
            <img
              src="/CONEJO_NUEVO.png"
              alt="Logo ON"
              className="w-24 drop-shadow-[0_0_24px_rgba(236,72,153,0.85)] md:w-44"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-10 md:px-12 xl:px-20 xl:py-14">
        <div className="grid gap-8 xl:grid-cols-[1.45fr_0.8fr]">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-[24px] border border-white/10 bg-zinc-950/80 p-5 shadow-[0_0_35px_rgba(0,0,0,0.78)] md:rounded-[28px] md:p-8"
          >
            <div className="mb-8">
              <h2 className="font-['Bebas_Neue'] text-4xl uppercase tracking-wide text-pink-400 drop-shadow-[0_0_14px_rgba(236,72,153,0.75)] md:text-5xl">
                Haz tu reserva
              </h2>

              <p className="mt-2 text-white/65">
                Completa los datos y asegura tu lugar. La ubicación exacta se
                comparte al confirmar tu reservación.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <SelectField
                label="Evento"
                name="evento"
                value={formData.evento}
                error={errors.evento}
                onChange={handleChange}
                options={[
                  { label: 'Selecciona un evento', value: '' },
                  ...eventOptions,
                ]}
              />

              <InputField
                label="Fecha"
                name="fecha"
                type="date"
                min={minReservationDate}
                value={formData.fecha}
                error={errors.fecha}
                onChange={handleChange}
              />

              <SelectField
                label="Personas"
                name="personas"
                value={formData.personas}
                error={errors.personas}
                onChange={handleChange}
                options={[
                  { label: 'Selecciona personas', value: '' },
                  ...peopleOptions.map((people) => ({
                    label: `${people} Personas`,
                    value: people,
                  })),
                ]}
              />

              <SelectField
                label="Hora"
                name="hora"
                value={formData.hora}
                error={errors.hora}
                onChange={handleChange}
                options={[
                  { label: 'Selecciona una hora', value: '' },
                  ...timeOptions,
                ]}
              />

              <div className="md:col-span-2">
                <SelectField
                  label="Tipo de mesa"
                  name="tipoMesa"
                  value={formData.tipoMesa}
                  error={errors.tipoMesa}
                  onChange={handleChange}
                  options={[
                    { label: 'Selecciona el tipo de mesa', value: '' },
                    ...tableOptions,
                  ]}
                />
              </div>

              <InputField
                label="Nombre"
                name="nombre"
                type="text"
                placeholder="Tu nombre"
                value={formData.nombre}
                error={errors.nombre}
                onChange={handleChange}
              />

              <InputField
                label="Teléfono"
                name="telefono"
                type="tel"
                placeholder="Ej. 9841234567"
                value={formData.telefono}
                error={errors.telefono}
                onChange={handleChange}
              />

              <div className="md:col-span-2">
                <TextAreaField
                  label="Comentarios opcionales"
                  name="comentarios"
                  placeholder="Cumpleaños, botella especial, zona preferida, etc."
                  value={formData.comentarios}
                  error={errors.comentarios}
                  onChange={handleChange}
                />
              </div>
            </div>

            {successMessage && (
              <div className="mt-6 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-4 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.25)]">
                {successMessage}
              </div>
            )}

            {submitError && (
              <div className="mt-6 rounded-xl border border-red-400/40 bg-red-500/10 px-5 py-4 text-red-200 shadow-[0_0_18px_rgba(248,113,113,0.2)]">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`${neonButton} mt-8 w-full py-5 disabled:cursor-not-allowed disabled:opacity-55`}
            >
              {isSubmitting ? 'Enviando reserva...' : 'Continuar reserva'}
            </button>

            <p className="mt-5 text-center text-sm text-white/45">
              Tu información está protegida y solo se usará para tu reservación.
            </p>
          </form>

          <aside className="space-y-6">
            <InfoCard
              title="Información importante"
              text="Tu reservación queda sujeta a disponibilidad. Nuestro equipo confirmará tu asistencia, ubicación y detalles por llamada o mensaje."
            />

            <div className="rounded-[24px] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_0_35px_rgba(0,0,0,0.78)] md:rounded-[28px] md:p-7">
              <h3 className="mb-5 font-['Bebas_Neue'] text-4xl uppercase tracking-wide text-pink-400">
                Ubicación del evento
              </h3>

              <p className="leading-relaxed text-white/70">
                Blackout ON realiza experiencias en salones y espacios
                privados. La ubicación exacta se comparte únicamente al
                confirmar tu reservación.
              </p>

              <div className="mt-6 rounded-2xl border border-pink-500/30 bg-pink-500/10 p-4 text-sm uppercase tracking-wide text-pink-200">
                Evento privado · ubicación privada · cupo limitado
              </div>
            </div>

            <ExperienceMiniCard />
          </aside>
        </div>

        <div className="mt-8 grid grid-cols-1 overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,14,18,0.92),rgba(5,5,8,0.92))] shadow-[0_0_22px_rgba(236,72,153,0.12)] md:grid-cols-2 xl:grid-cols-4">
          <Benefit
            icon={
              <ShieldCheck
                size={42}
                strokeWidth={1.8}
                className="text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.95)]"
              />
            }
            title="Reserva segura"
            text="Tus datos están protegidos"
            titleColor="text-sky-300"
            hoverColor="hover:bg-sky-500/10"
          />

          <Benefit
            icon={
              <Wine
                size={42}
                strokeWidth={1.8}
                className="text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.95)]"
              />
            }
            title="Mejores mesas"
            text="Ubicaciones privilegiadas"
            titleColor="text-yellow-200"
            hoverColor="hover:bg-yellow-400/10"
          />

          <Benefit
            icon={
              <Star
                size={42}
                strokeWidth={1.8}
                className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.95)]"
              />
            }
            title="Experiencia ON"
            text="Atención personalizada y ambiente blackout"
            titleColor="text-emerald-300"
            hoverColor="hover:bg-emerald-500/10"
          />

          <Benefit
            icon={
              <Gem
                size={42}
                strokeWidth={1.8}
                className="text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.95)]"
              />
            }
            title="Cancelación flexible"
            text="Cambia tu reservación sin complicaciones"
            titleColor="text-purple-300"
            hoverColor="hover:bg-purple-500/10"
          />
        </div>
      </section>
    </main>
  )
}

function ExperienceMiniCard() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-blue-500/70 bg-[linear-gradient(135deg,rgba(8,8,16,0.98),rgba(18,8,28,0.96))] px-6 py-7 shadow-[0_0_34px_rgba(59,130,246,0.16)] md:rounded-[30px] md:px-9 md:py-9">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(236,72,153,0.15),transparent_28%),radial-gradient(circle_at_85%_22%,rgba(59,130,246,0.12),transparent_30%)]" />

      <div className="mini-laser mini-laser-pink top-[28%] left-[58%] w-[32%] rotate-[16deg]" />
      <div className="mini-laser mini-laser-blue top-[56%] left-[55%] w-[28%] rotate-[-12deg]" />

      <div className="relative flex min-h-[190px] flex-col items-center gap-6 text-center sm:flex-row sm:text-left md:gap-7">
        <div className="flex items-center justify-center border-b border-white/10 pb-5 sm:min-w-[118px] sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6 md:min-w-[130px] md:pr-7">
          <img
            src="/CONEJO_NUEVO.png"
            alt="Logo ON"
            className="w-24 drop-shadow-[0_0_22px_rgba(236,72,153,0.9)] md:w-28"
          />
        </div>

        <div className="flex-1">
          <p className="text-shimmer-pink text-base font-bold uppercase tracking-wide md:text-xl">
            Vive la experiencia
          </p>

          <h3 className="font-['Bebas_Neue'] text-shimmer-pink text-5xl uppercase leading-none md:text-7xl">
            Blackout
          </h3>

          <p className="text-shimmer-white mt-3 text-xl uppercase leading-[1.35] tracking-wide md:text-2xl">
            Luz apagada,
            <br />
            sentidos encendidos.
          </p>
        </div>
      </div>
    </div>
  )
}

function InputField({
  label,
  name,
  type,
  value,
  error,
  placeholder,
  min,
  onChange,
}: {
  label: string
  name: keyof FormData
  type: string
  value: string
  error?: string
  placeholder?: string
  min?: string
  onChange: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void
}) {
  return (
    <label data-error={error ? 'true' : undefined}>
      <span className="mb-2 block text-sm uppercase tracking-wide text-white/65">
        {label}
      </span>

      <input
        name={name}
        type={type}
        value={value}
        min={min}
        maxLength={name === 'telefono' ? 10 : undefined}
        inputMode={name === 'telefono' ? 'numeric' : undefined}
        placeholder={placeholder}
        onChange={onChange}
        className={`w-full rounded-md border bg-white/5 px-5 py-4 outline-none transition-all duration-300 placeholder:text-white/25 focus:bg-pink-500/10 ${
          error
            ? 'border-red-400 text-red-200 shadow-[0_0_14px_rgba(248,113,113,0.35)]'
            : 'border-white/10 text-white focus:border-pink-500/70 focus:shadow-[0_0_18px_rgba(236,72,153,0.35)]'
        }`}
      />

      <FieldError message={error} />
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-red-400/35 bg-red-500/10 text-sm text-red-100 shadow-[0_0_16px_rgba(248,113,113,0.2)]">
      <div className="h-1 bg-gradient-to-r from-pink-500 via-cyan-300 to-yellow-300" />
      <p className="px-3 py-2">{message}</p>
    </div>
  )
}

function SelectField({
  label,
  name,
  value,
  error,
  options,
  onChange,
}: {
  label: string
  name: keyof FormData
  value: string
  error?: string
  options: { label: string; value: string }[]
  onChange: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void
}) {
  return (
    <label data-error={error ? 'true' : undefined}>
      <span className="mb-2 block text-sm uppercase tracking-wide text-white/65">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full rounded-md border bg-zinc-950 px-5 py-4 outline-none transition-all duration-300 focus:bg-pink-500/10 ${
          error
            ? 'border-red-400 text-red-200 shadow-[0_0_14px_rgba(248,113,113,0.35)]'
            : 'border-white/10 text-white focus:border-pink-500/70 focus:shadow-[0_0_18px_rgba(236,72,153,0.35)]'
        }`}
      >
        {options.map((option) => (
          <option
            key={option.label}
            value={option.value}
            className="bg-zinc-950 text-white"
          >
            {option.label}
          </option>
        ))}
      </select>

      <FieldError message={error} />
    </label>
  )
}

function TextAreaField({
  label,
  name,
  value,
  error,
  placeholder,
  onChange,
}: {
  label: string
  name: keyof FormData
  value: string
  error?: string
  placeholder?: string
  onChange: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void
}) {
  return (
    <label data-error={error ? 'true' : undefined}>
      <span className="mb-2 block text-sm uppercase tracking-wide text-white/65">
        {label}
      </span>

      <textarea
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        rows={4}
        className={`w-full resize-none rounded-md border bg-white/5 px-5 py-4 outline-none transition-all duration-300 placeholder:text-white/25 focus:bg-pink-500/10 ${
          error
            ? 'border-red-400 text-red-200 shadow-[0_0_14px_rgba(248,113,113,0.35)]'
            : 'border-white/10 text-white focus:border-pink-500/70 focus:shadow-[0_0_18px_rgba(236,72,153,0.35)]'
        }`}
      />

      <FieldError message={error} />
    </label>
  )
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-zinc-950/80 p-7 shadow-[0_0_35px_rgba(0,0,0,0.78)]">
      <h3 className="font-['Bebas_Neue'] text-4xl uppercase tracking-wide text-pink-400">
        {title}
      </h3>

      <p className="mt-3 leading-relaxed text-white/70">{text}</p>
    </div>
  )
}

function Benefit({
  icon,
  title,
  text,
  titleColor,
  hoverColor,
}: {
  icon: ReactNode
  title: string
  text: string
  titleColor: string
  hoverColor: string
}) {
  return (
    <div
      className={`group border-b border-white/10 px-5 py-5 transition-all duration-300 last:border-b-0 md:border-r md:px-6 md:py-6 md:last:border-r-0 xl:border-b-0 ${hoverColor}`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center transition-all duration-300 group-hover:scale-110 md:h-12 md:w-12">
          {icon}
        </div>

        <div className="flex-1">
          <h4
            className={`${titleColor} text-lg font-bold uppercase tracking-wide transition-all duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.45)] md:text-xl`}
          >
            {title}
          </h4>

          <p className="mt-1 text-base leading-snug text-white/75 md:text-lg">
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Reservacion
