# ZEUS Runtime

Camada de controlo local transplantada por engenharia inversa a partir da base externa, adaptada ao repositório real do ZEUS.

## Módulos integrados

- `zeusOpenAppCore.py`
- `zeusFileControllerCore.py`
- `zeusComputerControlCore.py`
- `zeusBrowserControlCore.py`

## Wrappers de CLI

- `zeusOpenApp.py`
- `zeusFileControl.py`
- `zeusComputerControl.py`
- `zeusBrowserControl.py`

## Exemplos

```powershell
python founder-command-center\zeus-runtime\zeusOpenApp.py chrome
python founder-command-center\zeus-runtime\zeusFileControl.py list --path desktop
python founder-command-center\zeus-runtime\zeusBrowserControl.py search --query "arquimla lsf"
python founder-command-center\zeus-runtime\zeusComputerControl.py screenshot --path "%USERPROFILE%\\Desktop\\zeus.png"
```

## Segurança

- envio automático continua a exigir aprovação explícita;
- `send-active` só executa com `--approved-by Miguel`;
- o fluxo Hermes continua a ser a camada certa para email.
