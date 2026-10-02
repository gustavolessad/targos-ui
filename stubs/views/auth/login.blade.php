{{--
    A tela de login. Modelo do targos/ui: este arquivo é do projeto, e
    pode mudar à vontade — outro campo de entrada, "esqueci a senha",
    verificação contra robôs.

    Espera a rota `login` (POST) e os campos `email`, `password` e
    `remember`.
--}}
<x-layouts.guest title="Login">
    <div class="flex min-h-screen items-center justify-center px-4 py-12">
        <div class="w-full max-w-sm">
            <div class="mb-8 flex justify-center text-xl font-semibold text-neutral-900 dark:text-white">
                {{ config('app.name') }}
            </div>

            <x-ui.card padding="lg">
                <form method="POST" action="{{ route('login') }}" class="space-y-4">
                    @csrf

                    <x-ui.input name="email" type="email" label="E-mail" required autofocus />

                    <x-ui.password name="password" label="Senha" required />

                    {{-- Sem o campo escondido: o Laravel pergunta se `remember` veio, e não o valor dele. --}}
                    <x-ui.checkbox name="remember" label="Lembrar de mim" :falsy="false" />

                    <x-ui.button type="submit" class="w-full">Entrar</x-ui.button>
                </form>
            </x-ui.card>
        </div>
    </div>
</x-layouts.guest>
